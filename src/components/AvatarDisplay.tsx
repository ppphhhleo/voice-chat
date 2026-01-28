"use client";

import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { BigFive } from "@/types";
import { SAMPLE_RATE } from "@/constants";
import { AudioStreamHandler } from "@/hooks/useVoiceChat";
import type { TalkingHead } from "@met4citizen/talkinghead";

export type AnimationPreset = "idle" | "wave" | "thinking";

interface AvatarDisplayProps {
  traits: BigFive;
  onStreamReady: (handler: AudioStreamHandler | null) => void;
  onHeadReady?: (head: TalkingHead | null) => void;
}

// Map Big Five traits to TalkingHead mood
function traitsToMood(traits: BigFive): string {
  const { extraversion, agreeableness, neuroticism, openness } = traits;

  if (neuroticism > 75) return "sad";
  if (extraversion > 70 && agreeableness > 60) return "happy";
  if (extraversion > 70 && agreeableness < 40) return "angry";
  if (agreeableness > 75) return "love";
  if (openness > 75 && extraversion > 50) return "happy";
  if (neuroticism > 60 && agreeableness < 40) return "angry";
  if (extraversion < 30 && neuroticism > 50) return "fear";
  return "neutral";
}

const ANIMATION_PRESETS: { id: AnimationPreset; label: string; desc: string }[] = [
  { id: "idle", label: "Idle", desc: "Natural stance" },
  { id: "wave", label: "Wave", desc: "Friendly greeting" },
  { id: "thinking", label: "Think", desc: "Contemplating" },
];

export function AvatarDisplay({ traits, onStreamReady, onHeadReady }: AvatarDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHead | null>(null);
  const initRef = useRef(false);
  const [activePreset, setActivePreset] = useState<AnimationPreset>("idle");
  const [isLoading, setIsLoading] = useState(true);

  const mood = useMemo(() => traitsToMood(traits), [traits]);

  // Create the audio stream handler for TalkingHead
  const createStreamHandler = useCallback((): AudioStreamHandler => {
    return {
      onStart: () => {
        const head = headRef.current;
        if (head) {
          head.streamStart({ sampleRate: SAMPLE_RATE, lipsyncLang: "en" });
        }
      },
      onAudio: (pcm16: Int16Array) => {
        const head = headRef.current;
        if (head) {
          head.streamAudio({ audio: pcm16 });
        }
      },
      onEnd: () => {
        const head = headRef.current;
        if (head) {
          head.streamNotifyEnd();
        }
      },
    };
  }, []);

  // Play animation preset
  const playPreset = useCallback(async (preset: AnimationPreset) => {
    const head = headRef.current;
    if (!head) return;

    setActivePreset(preset);

    switch (preset) {
      case "idle":
        head.stopSpeaking();
        break;
      case "wave":
        head.setMood("happy");
        head.playGesture("handup", 4, false, 800);
        break;
      case "thinking":
        head.setMood("neutral");
        head.playGesture("index", 4, false, 800);
        break;
    }
  }, []);

  // Initialize TalkingHead
  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    let disposed = false;

    async function init() {
      try {
        const { TalkingHead: TH } = await import("@met4citizen/talkinghead");

        if (disposed || !containerRef.current) return;

        const head = new TH(containerRef.current, {
          ttsEndpoint: null,
          lipsyncModules: [],
          cameraView: "full",
          cameraDistance: 0.4,
          cameraRotateEnable: true,
          cameraPanEnable: false,
          avatarMood: "neutral",
          modelFPS: 30,
          modelPixelRatio: Math.min(window.devicePixelRatio, 2),
        });

        // Load lipsync module from public/ to bypass webpack bundling issues
        // TalkingHead uses import('./lipsync-en.mjs') internally which fails after bundling
        try {
          // @ts-expect-error runtime browser import from public URL
          const lipsyncModule = await import(/* webpackIgnore: true */ "/modules/lipsync-en.mjs");
          (head as unknown as { lipsync: Record<string, unknown> }).lipsync["en"] =
            new lipsyncModule.LipsyncEn();
        } catch (e) {
          console.warn("Failed to load lipsync module:", e);
        }

        await head.showAvatar(
          {
            url: "/avatars/brunette.glb",
            body: "F",
            avatarMood: "neutral",
            lipsyncLang: "en",
          },
          (ev: ProgressEvent) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              console.log(`Avatar loading: ${pct}%`);
            }
          }
        );

        if (disposed) return;

        headRef.current = head;
        setIsLoading(false);
        onStreamReady(createStreamHandler());
        onHeadReady?.(head);
      } catch (err) {
        console.error("TalkingHead init failed:", err);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      disposed = true;
      onStreamReady(null);
      onHeadReady?.(null);
      if (headRef.current) {
        headRef.current.stop();
        headRef.current = null;
      }
    };
  }, [onStreamReady, onHeadReady, createStreamHandler]);

  // Update mood when personality traits change
  useEffect(() => {
    const head = headRef.current;
    if (head) {
      try {
        head.setMood(mood);
      } catch {
        // Mood may not be available yet
      }
    }
  }, [mood]);

  return (
    <div className="card overflow-hidden relative flex flex-col">
      {/* Avatar container */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[400px]"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-1)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[var(--muted)]">Loading avatar...</span>
          </div>
        </div>
      )}

      {/* Top labels */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-[var(--muted)] bg-[var(--surface-1)]/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
          3D Avatar
        </span>
        <span className="text-[10px] text-[var(--muted)] bg-[var(--surface-1)]/80 backdrop-blur-sm px-2 py-0.5 rounded-full capitalize">
          {mood}
        </span>
      </div>

      {/* Animation presets */}
      {!isLoading && (
        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 justify-center">
          {ANIMATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => playPreset(preset.id)}
              title={preset.desc}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                activePreset === preset.id
                  ? "bg-[var(--accent)] text-[var(--surface)] shadow-[0_4px_12px_rgba(90,155,255,0.4)]"
                  : "bg-[var(--surface-1)]/80 backdrop-blur-sm text-[var(--muted)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
