"use client";

import { Voice } from "@/types";
import { VOICES } from "@/constants";

interface VoiceSelectorProps {
  voice: Voice;
  onVoiceChange: (v: Voice) => void;
}

export function VoiceSelector({ voice, onVoiceChange }: VoiceSelectorProps) {
  return (
    <div className="card p-5">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.2em] mb-3">Voice</h2>
      <div className="flex flex-wrap gap-2">
        {VOICES.map((v) => {
          const active = voice === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onVoiceChange(v.id)}
              className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
                active
                  ? "bg-[rgba(138,180,248,0.18)] border-[var(--accent)] text-[var(--on-surface)] shadow-[0_10px_25px_-15px_rgba(90,155,255,0.8)]"
                  : "bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)] border-[var(--outline)] text-[var(--muted)] hover:text-[var(--on-surface)]"
              }`}
            >
              {v.label}
              <span className="text-[var(--muted)] font-normal ml-1 text-xs">({v.desc})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
