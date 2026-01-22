"use client";

import { BigFive } from "@/types";
import { TRAIT_LABELS } from "@/constants";

interface PersonalitySlidersProps {
  traits: BigFive;
  onTraitsChange: (t: BigFive) => void;
}

export function PersonalitySliders({ traits, onTraitsChange }: PersonalitySlidersProps) {
  return (
    <div className="card p-5">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.2em] mb-3">
        Personality (Big Five)
      </h2>
      <div className="space-y-3">
        {(Object.keys(traits) as (keyof BigFive)[]).map((trait) => (
          <div key={trait}>
            <div className="flex justify-between text-xs mb-2 uppercase tracking-wide text-[var(--muted)]">
              <span>{TRAIT_LABELS[trait].low}</span>
              <span className="text-[color-mix(in_srgb,var(--on-surface) 90%, transparent)] capitalize">{trait}</span>
              <span>{TRAIT_LABELS[trait].high}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={traits[trait]}
              onChange={(e) =>
                onTraitsChange({ ...traits, [trait]: +e.target.value })
              }
              className="w-full h-2 rounded-full bg-[var(--surface-2)] accent-[var(--accent)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
