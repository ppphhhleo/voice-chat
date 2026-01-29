"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllCharacters, Character } from "@/characters";
import { AudioStreamHandler } from "@/hooks/useVoiceChat";
import type { TalkingHead } from "@met4citizen/talkinghead";

interface AvatarGallery3DProps {
  onCharacterChange: (character: Character) => void;
  onStreamReady: (handler: AudioStreamHandler | null) => void;
  onHeadReady?: (head: TalkingHead | null) => void;
  initialCharacterId?: string;
}

/**
 * Renders a single TalkingHead canvas and swaps avatars as the user selects characters.
 * This avoids creating multiple WebGL contexts (which can prevent rendering entirely on some machines)
 * and gives us a single place to attach stream handlers / gestures.
 */
export function AvatarGallery3D({
  onCharacterChange,
  onStreamReady,
  onHeadReady,
  initialCharacterId = "alex",
}: AvatarGallery3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHead | null>(null);
  const [selectedId, setSelectedId] = useState(initialCharacterId);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const characters = useMemo(() => getAllCharacters(), []);
  const selectedCharacter =
    characters.find((c) => c.id === selectedId) ?? characters[0];
  const initialCharacterRef = useRef<Character | null>(
    characters.find((c) => c.id === initialCharacterId) ?? characters[0]
  );

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
        onAudio: (pcm16: Int16Array) => {
          head.streamAudio({ audio: pcm16 });
        },
        onEnd: () => {
          head.streamNotifyEnd();
        },
        onTranscript: (text: string) => {
          const words = text.split(/\s+/).filter((w) => w.length > 0);
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

  const selectCharacter = useCallback(
    async (characterId: string) => {
      const character = characters.find((c) => c.id === characterId);
      if (!character || !headRef.current) return;

      setSelectedId(characterId);
      setIsSwitching(true);
      setLoadError(null);

      try {
        await headRef.current.showAvatar({
          url: character.avatar,
          body: "F",
          avatarMood: character.mood,
          lipsyncLang: "en",
        });

        onCharacterChange(character);
        onHeadReady?.(headRef.current);
        onStreamReady(buildStreamHandler(headRef.current));
      } catch (err) {
        console.error("Failed to swap avatar:", err);
        setLoadError("Failed to load avatar. Please try another character.");
      } finally {
        setIsSwitching(false);
      }
    },
    [buildStreamHandler, characters, onCharacterChange, onHeadReady, onStreamReady]
  );

  // Initialize TalkingHead once
  useEffect(() => {
    let disposed = false;

    async function init() {
      if (!containerRef.current) return;
      try {
        const { TalkingHead: TH } = await import("@met4citizen/talkinghead");

        if (disposed || !containerRef.current) return;

        const head = new TH(containerRef.current, {
          ttsEndpoint: null,
          lipsyncModules: [],
          cameraView: "full",
          cameraDistance: 1.5,
          cameraX: 0,
          cameraY: 0.4,
          cameraRotateEnable: true,
          cameraPanEnable: true,
          avatarMood: initialCharacterRef.current?.mood,
          modelFPS: 30,
          modelPixelRatio: Math.min(window.devicePixelRatio, 2),
        });

        // Load lipsync module
        try {
          // @ts-expect-error runtime browser import from public URL
          const lipsyncModule = await import(
            /* webpackIgnore: true */ "/modules/lipsync-en.mjs"
          );
          (head as any).lipsync["en"] = new lipsyncModule.LipsyncEn();
        } catch (e) {
          console.warn("Failed to load lipsync module:", e);
        }

        headRef.current = head;

        // Show initial avatar
        await head.showAvatar({
          url: initialCharacterRef.current?.avatar,
          body: "F",
          avatarMood: initialCharacterRef.current?.mood,
          lipsyncLang: "en",
        });

        if (disposed) return;

        if (initialCharacterRef.current) {
          onCharacterChange(initialCharacterRef.current);
        }
        onHeadReady?.(head);
        onStreamReady(buildStreamHandler(head));
        setIsLoading(false);
      } catch (err) {
        if (!disposed) {
          console.error("Failed to initialize avatars:", err);
          setLoadError(
            err instanceof Error ? err.message : "Failed to initialize avatars"
          );
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      disposed = true;
      headRef.current?.stop?.();
      headRef.current = null;
      onStreamReady(null);
      onHeadReady?.(null);
    };
  }, [buildStreamHandler, onCharacterChange, onHeadReady, onStreamReady]);

  // Expose handler when the user changes characters via dots
  const handleDotClick = useCallback(
    (id: string) => {
      if (id === selectedId || isSwitching || isLoading) return;
      selectCharacter(id);
    },
    [isLoading, isSwitching, selectCharacter, selectedId]
  );

  return (
    <div className="card overflow-hidden relative flex flex-col">
      {/* 3D Avatar */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[520px] bg-gray-900 relative"
        style={{ cursor: "grab" }}
      />

      {(isLoading || isSwitching) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-lg">
            {isSwitching ? "Switching avatar..." : "Loading avatars..."}
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-x-4 bottom-24 bg-red-900/70 border border-red-500 text-red-50 text-sm px-4 py-3 rounded">
          {loadError}
        </div>
      )}

      {/* Selected character info overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-4 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: selectedCharacter.primaryColor }}
          >
            {selectedCharacter.name[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {selectedCharacter.name}
            </h3>
            <p className="text-sm text-gray-300">{selectedCharacter.description}</p>
          </div>
          <div className="text-sm text-gray-400 text-right">
            <div>Voice: {selectedCharacter.voice}</div>
            <div className="text-xs mt-1">Click colored dots to switch</div>
          </div>
        </div>
      </div>

      {/* Character indicators */}
      <div className="absolute top-4 left-4 right-4 flex justify-center gap-2">
        {characters.map((character) => (
          <button
            key={character.id}
            className={`w-3 h-3 rounded-full transition-all ${
              character.id === selectedId ? "scale-150" : "opacity-40"
            }`}
            style={{ backgroundColor: character.primaryColor }}
            onClick={() => handleDotClick(character.id)}
            title={character.name}
            aria-label={`Select ${character.name}`}
          />
        ))}
      </div>
    </div>
  );
}
