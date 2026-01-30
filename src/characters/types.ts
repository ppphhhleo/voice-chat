/**
 * Character System Types
 *
 * Defines character profiles with unique personalities, voices, and behaviors
 */

import { BigFive, Voice } from '@/types';

export type CharacterId = 'alex' | 'maya' | 'jordan' | 'sam' | 'riley';

export type MoodType = 'neutral' | 'happy' | 'sad' | 'angry' | 'love' | 'fear';
export type Gender = 'male' | 'female' | 'non-binary';

export interface GestureBehavior {
  frequency: 'very low' | 'low' | 'moderate' | 'high' | 'very high';
  style: 'minimal' | 'precise' | 'balanced' | 'expressive' | 'animated';
  favoriteGestures: string[];
  confidenceMultiplier?: number; // Multiplier for gesture confidence (default: 1.0)
  intervalWords?: number; // Words between rhythm gestures (default: 40)
}

export interface Character {
  id: CharacterId;
  name: string;
  description: string;
  avatar: string; // Path to GLB file
  voice: Voice;
  gender: Gender;
  body: 'M' | 'F';
  personality: BigFive;
  mood: MoodType;
  primaryColor: string; // Hex color for theming
  gestureBehavior: GestureBehavior;
  idleGestures?: string[]; // Gestures to occasionally play while idle
}

export interface CharacterState {
  selectedId: CharacterId;
  characters: Record<CharacterId, Character>;
}
