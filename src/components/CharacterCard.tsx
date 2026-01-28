/**
 * Character Card Component
 *
 * Displays a single character card.
 * Only renders the placeholder - actual 3D avatar is rendered separately.
 */

'use client';

import { useMemo } from 'react';
import { Character } from '@/characters';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
}

export function CharacterCard({
  character,
  isSelected,
  onSelect
}: CharacterCardProps) {
  const cardStyle = useMemo(() => {
    if (isSelected) {
      return {
        boxShadow: `0 0 30px ${character.primaryColor}`,
        transform: 'scale(1.05)',
        opacity: 1,
        border: `3px solid ${character.primaryColor}`,
        filter: 'brightness(1.1)'
      };
    }
    return {
      opacity: 0.6,
      transform: 'scale(1.0)',
      filter: 'brightness(0.7) grayscale(0.3)',
      border: '3px solid transparent'
    };
  }, [isSelected, character.primaryColor]);

  const labelStyle = useMemo(() => {
    if (isSelected) {
      return {
        backgroundColor: character.primaryColor,
        color: '#ffffff',
        fontWeight: 600
      };
    }
    return {
      backgroundColor: 'var(--surface-2)',
      color: 'var(--muted)'
    };
  }, [isSelected, character.primaryColor]);

  return (
    <div
      onClick={onSelect}
      className="relative cursor-pointer transition-all duration-300 rounded-lg overflow-hidden bg-[var(--surface-1)]"
      style={cardStyle}
    >
      {/* Character Preview - Simple colored box for now */}
      <div
        className="relative aspect-[3/4] flex items-center justify-center"
        style={{ backgroundColor: `${character.primaryColor}20` }}
      >
        {/* Character initial/icon */}
        <div
          className="text-6xl font-bold"
          style={{ color: character.primaryColor }}
        >
          {character.name[0]}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: character.primaryColor }}
            />
          </div>
        )}

        {/* Voice badge */}
        <div className="absolute top-2 left-2">
          <div className="text-[9px] px-2 py-0.5 rounded-full bg-black/30 text-white">
            {character.voice}
          </div>
        </div>
      </div>

      {/* Character Label */}
      <div
        className="px-3 py-2 text-center transition-all duration-300"
        style={labelStyle}
      >
        <div className="text-sm font-semibold">{character.name}</div>
        <div className="text-xs mt-0.5 opacity-80">
          {character.description}
        </div>
      </div>

      {/* Click hint (only when not selected) */}
      {!isSelected && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
          <div className="text-xs text-white bg-black/60 px-3 py-1 rounded-full">
            Click to select
          </div>
        </div>
      )}
    </div>
  );
}
