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
  avatarUrl?: string; // Optional custom avatar URL (default: /avatars/brunette.glb)
  initialMood?: string; // Optional initial mood (default: from traits)
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

export function AvatarDisplay({
  traits,
  onStreamReady,
  onHeadReady,
  avatarUrl = '/avatars/brunette.glb',
  initialMood
}: AvatarDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHead | null>(null);
  const initRef = useRef(false);
  const [activePreset, setActivePreset] = useState<AnimationPreset>("idle");
  const [isLoading, setIsLoading] = useState(true);

  const mood = useMemo(() => initialMood || traitsToMood(traits), [initialMood, traits]);

  // Track audio timing for word-based lipsync
  const audioTimeRef = useRef(0);
  const wordQueueRef = useRef<string[]>([]);
  const wordBudgetRef = useRef(0); // Accumulated word budget based on audio duration

  // Create the audio stream handler for TalkingHead
  const createStreamHandler = useCallback((): AudioStreamHandler => {
    return {
      onStart: () => {
        const head = headRef.current;
        if (head) {
          audioTimeRef.current = 0;
          wordQueueRef.current = [];
          wordBudgetRef.current = 0;
          head.streamStart({
            sampleRate: SAMPLE_RATE,
            lipsyncLang: "en",
            lipsyncType: "words",
          });
        }
      },
      onAudio: (pcm16: Int16Array) => {
        const head = headRef.current;
        if (!head) return;

        // Calculate audio chunk duration in ms
        const chunkDurationMs = (pcm16.length / SAMPLE_RATE) * 1000;

        // Accumulate word budget based on typical speech rate (~2.5 words/sec)
        const wordsPerSecond = 2.5;
        wordBudgetRef.current += (chunkDurationMs / 1000) * wordsPerSecond;

        // Only take whole words when we have budget for at least 1
        const wordsToTake = Math.min(
          Math.floor(wordBudgetRef.current),
          wordQueueRef.current.length
        );

        if (wordsToTake > 0) {
          const wordsToUse = wordQueueRef.current.splice(0, wordsToTake);
          wordBudgetRef.current -= wordsToTake;

          // Calculate timing for words within this chunk
          const wordDuration = chunkDurationMs / wordsToUse.length;
          const wtimes: number[] = [];
          const wdurations: number[] = [];

          for (let i = 0; i < wordsToUse.length; i++) {
            wtimes.push(audioTimeRef.current + i * wordDuration);
            wdurations.push(wordDuration * 0.85);
          }

          head.streamAudio({
            audio: pcm16,
            words: wordsToUse,
            wtimes: wtimes,
            wdurations: wdurations,
          });
        } else {
          head.streamAudio({ audio: pcm16 });
        }

        audioTimeRef.current += chunkDurationMs;
      },
      onEnd: () => {
        const head = headRef.current;
        if (head) {
          head.streamNotifyEnd();
        }
        audioTimeRef.current = 0;
        wordQueueRef.current = [];
        wordBudgetRef.current = 0;
      },
      onTranscript: (text: string) => {
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        wordQueueRef.current.push(...words);
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
            url: avatarUrl,
            body: "F",
            avatarMood: initialMood || "neutral",
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
