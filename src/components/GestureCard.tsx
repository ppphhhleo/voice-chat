"use client";

import { Character } from "@/characters";

interface GestureCardProps {
  character: Character;
}

export function GestureCard({ character }: GestureCardProps) {
  const behavior = character.gestureBehavior;
  return (
    <div className="mt-2 mx-2 mb-3 rounded-lg border border-[var(--outline)] bg-[var(--surface-2)]/80 p-2 text-[11px] text-[var(--muted)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: character.primaryColor }}
          />
          <div>
            <div className="font-semibold text-white text-sm leading-tight">
              {character.name}
            </div>
            <div className="text-[var(--muted)] text-[10px] leading-tight">
              {behavior.style} · {character.gender}
            </div>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full font-semibold"
          style={{ backgroundColor: `${character.primaryColor}22`, color: character.primaryColor }}
        >
          {behavior.frequency}
        </span>
      </div>
      <div className="mt-1">
        <span className="text-[var(--muted)]">Favorites: </span>
        <span className="text-white">
          {behavior.favoriteGestures.join(", ")}
        </span>
      </div>
      <div className="mt-1">
        <span className="text-[var(--muted)]">Idle gestures: </span>
        <span className="text-white">
          {character.idleGestures?.length
            ? character.idleGestures.join(", ")
            : "None"}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span>Gap ~{behavior.intervalWords ?? 40} words</span>
        <span>Conf ×{behavior.confidenceMultiplier ?? 1}</span>
      </div>
    </div>
  );
}
