/**
 * Character Gallery Component
 *
 * Displays all characters in a horizontal gallery.
 * Manages character selection and coordinates avatar rendering.
 */

'use client';

import { useState, useCallback } from 'react';
import { getAllCharacters, Character, CharacterId } from '@/characters';
import { CharacterCard } from './CharacterCard';
import { AvatarDisplay } from './AvatarDisplay';
import { AudioStreamHandler } from '@/hooks/useVoiceChat';
import type { TalkingHead } from '@met4citizen/talkinghead';

interface CharacterGalleryProps {
  onCharacterChange: (character: Character) => void;
  onStreamReady: (handler: AudioStreamHandler | null) => void;
  onHeadReady?: (head: TalkingHead | null) => void;
  initialCharacterId?: CharacterId;
}

export function CharacterGallery({
  onCharacterChange,
  onStreamReady,
  onHeadReady,
  initialCharacterId = 'alex'
}: CharacterGalleryProps) {
  const [selectedId, setSelectedId] = useState<CharacterId>(initialCharacterId);
  const characters = getAllCharacters();
  const selectedCharacter = characters.find(c => c.id === selectedId) || characters[0];

  const handleSelectCharacter = useCallback((character: Character) => {
    setSelectedId(character.id);
    onCharacterChange(character);
  }, [onCharacterChange]);

  return (
    <div className="w-full space-y-4">
      {/* Gallery Header */}
      <div>
        <h2 className="text-lg font-semibold">Select Character</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          Click on a character to select them for conversation
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* Character Selection Gallery */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedId === character.id}
                onSelect={() => handleSelectCharacter(character)}
              />
            ))}
          </div>

          {/* Selected Character Info */}
          <div className="mt-4 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: selectedCharacter.primaryColor }}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  Speaking with {selectedCharacter.name}
                </div>
                <div className="text-xs text-[var(--muted)] mt-0.5">
                  {selectedCharacter.description} • Voice: {selectedCharacter.voice}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Avatar Display (Only for selected character) */}
        <div className="md:col-span-2">
          <div className="relative">
            <AvatarDisplay
              traits={selectedCharacter.personality}
              onStreamReady={onStreamReady}
              onHeadReady={onHeadReady}
              avatarUrl={selectedCharacter.avatar}
              initialMood={selectedCharacter.mood}
            />
            {/* Character name overlay on avatar */}
            <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                style={{ backgroundColor: selectedCharacter.primaryColor }}
              >
                {selectedCharacter.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
