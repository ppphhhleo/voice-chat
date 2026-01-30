"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllCharacters, Character } from "@/characters";
import { AudioStreamHandler } from "@/hooks/useVoiceChat";
import { GestureCard } from "./GestureCard";
import type { TalkingHead } from "@met4citizen/talkinghead";

interface AvatarGallery3DProps {
  onCharacterChange: (character: Character) => void;
  onStreamReady: (handler: AudioStreamHandler | null) => void;
  onHeadReady?: (head: TalkingHead | null) => void;
  initialCharacterId?: string;
}

/**
 * Shows all five avatars at once (row/grid). Only the selected avatar is live
 * for audio/lipsync; others are paused but remain visible.
 */
export function AvatarGallery3D({
  onCharacterChange,
  onStreamReady,
  onHeadReady,
  initialCharacterId = "alex",
}: AvatarGallery3DProps) {
  const characters = useMemo(() => getAllCharacters(), []);
  const initialId = characters.find((c) => c.id === initialCharacterId)?.id ?? characters[0].id;

  const [selectedId, setSelectedId] = useState(initialId);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mountedCount, setMountedCount] = useState(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const containerMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const headMapRef = useRef<Map<string, TalkingHead>>(new Map());

  const buildStreamHandler = useCallback(
    (head: TalkingHead | null): AudioStreamHandler | null => {
      if (!head) return null;
      return {
        onStart: () => {
          head.streamStart({
            sampleRate: 24000,
            lipsyncLang: "en",
            lipsyncType: "words",
          });
        },
        onAudio: (pcm16: Int16Array) => head.streamAudio({ audio: pcm16 }),
        onEnd: () => head.streamNotifyEnd(),
        onTranscript: (text: string) => {
          const words = text.split(/\s+/).filter(Boolean);
          head.streamAudio({
            audio: new Int16Array(0),
            words,
            wtimes: words.map((_, i) => i * 200),
            wdurations: words.map(() => 180),
          });
        },
      };
    },
    []
  );

  // Apply selection: pause others, resume selected, wire callbacks
  const applySelection = useCallback(
    (id: string) => {
      const character = characters.find((c) => c.id === id);
      const selectedHead = headMapRef.current.get(id) || null;
      if (!character || !selectedHead) return;

      headMapRef.current.forEach((head, hid) => {
        if (hid === id) {
          head.resume?.();
        } else {
          head.pause?.();
        }
      });

      setSelectedId(id);
      onCharacterChange(character);
      onHeadReady?.(selectedHead);
      onStreamReady(buildStreamHandler(selectedHead));

      // Restart idle gesture loop for the active head
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      const idleGestures = character.idleGestures ?? [];
      if (idleGestures.length > 0) {
        idleTimerRef.current = setInterval(() => {
          // Skip if head is missing
          const head = headMapRef.current.get(id);
          if (!head) return;
          const gesture = idleGestures[Math.floor(Math.random() * idleGestures.length)];
          head.playGesture?.(gesture, 1.5, false, 1000);
        }, 8000);
      }
    },
    [buildStreamHandler, characters, onCharacterChange, onHeadReady, onStreamReady]
  );

  // Instantiate a TalkingHead per container once all mounts exist
  useEffect(() => {
    let disposed = false;

    async function init() {
      if (mountedCount < characters.length) return; // wait until all refs set
      try {
        const { TalkingHead: TH } = await import("@met4citizen/talkinghead");

        let LipsyncEn: any = null;
        try {
          // @ts-expect-error runtime browser import from public URL
          const lipsyncModule = await import(/* webpackIgnore: true */ "/modules/lipsync-en.mjs");
          LipsyncEn = lipsyncModule.LipsyncEn;
        } catch (e) {
          console.warn("Failed to load lipsync module:", e);
        }

        for (const character of characters) {
          if (disposed) return;
          if (headMapRef.current.has(character.id)) continue;

          const mount = containerMapRef.current.get(character.id);
          if (!mount) continue;

          const head = new TH(mount, {
            ttsEndpoint: null,
            lipsyncModules: [],
            cameraView: "full",
            cameraDistance: 1.5,
            cameraX: 0,
            cameraY: 0.4,
            cameraRotateEnable: true,
            cameraPanEnable: true,
            cameraZoomEnable: true,
            avatarMood: character.mood,
            modelFPS: character.id === initialId ? 30 : 22,
            modelPixelRatio: character.id === initialId ? Math.min(window.devicePixelRatio, 2) : 1,
          });

          if (LipsyncEn) {
            (head as any).lipsync["en"] = new LipsyncEn();
          }

          await head.showAvatar({
            url: character.avatar,
            body: character.body,
            avatarMood: character.mood,
            lipsyncLang: "en",
          });

          // Keep non-selected paused to save GPU; selected will be resumed below
          head.pause?.();
          headMapRef.current.set(character.id, head);
        }

        if (!disposed) {
          applySelection(initialId);
          setIsLoading(false);
        }
      } catch (err) {
        if (!disposed) {
          console.error("Failed to initialize avatars:", err);
          setLoadError(err instanceof Error ? err.message : "Failed to initialize avatars");
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      disposed = true;
      onStreamReady(null);
      onHeadReady?.(null);
      headMapRef.current.forEach((head) => head.stop?.());
      headMapRef.current.clear();
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [applySelection, characters, initialId, mountedCount, onHeadReady, onStreamReady]);

  // Ref setter for each card
  const setContainer = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      containerMapRef.current.set(id, node);
    } else {
      containerMapRef.current.delete(id);
    }
    setMountedCount(containerMapRef.current.size);
  }, []);

  return (
    <div className="card relative p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {characters.map((character) => (
          <div
            key={character.id}
            className={`relative overflow-hidden rounded-xl border transition-all ${
              character.id === selectedId
                ? "border-[var(--accent)] shadow-lg shadow-[rgba(138,180,248,0.25)] scale-[1.01]"
                : "border-[var(--outline)]"
            }`}
            style={{ backgroundColor: "#0f172a" }}
            onClick={() => applySelection(character.id)}
            role="button"
            tabIndex={0}
          >
            <div
              ref={(node) => setContainer(character.id, node)}
              className="w-full aspect-[4/5] bg-black/70"
              style={{
                opacity: character.id === selectedId ? 1 : 0.65,
                cursor: "grab",
              }}
            />

            {/* <div
              className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-lg bg-black/70 px-3 py-2 text-sm text-white"
              style={{ pointerEvents: "none" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: character.primaryColor }}
                />
                <span className="font-semibold">{character.name}</span>
              </div>
              <span className="text-[11px] text-gray-300">{character.voice}</span>
            </div> */}

            <GestureCard character={character} />
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
          <div className="text-white text-lg">Loading avatars...</div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-x-4 bottom-4 bg-red-900/70 border border-red-500 text-red-50 text-sm px-4 py-3 rounded">
          {loadError}
        </div>
      )}
    </div>
  );
}
