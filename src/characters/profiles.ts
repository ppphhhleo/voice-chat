/**
 * Character Profiles
 *
 * 5 distinct characters with unique personalities, voices, and behaviors
 */

import { Character } from './types';

export const CHARACTERS: Record<string, Character> = {
  alex: {
    id: 'alex',
    name: 'Rex',
    description: 'Professional and organized',
    avatar: '/avatars/Rex.glb',
    voice: 'Rex', // Confident, clear
    gender: 'male',
    body: 'M',
    personality: {
      openness: 45,          // Practical
      conscientiousness: 85, // Highly organized
      extraversion: 60,      // Moderately outgoing
      agreeableness: 55,     // Balanced
      neuroticism: 25        // Very calm
    },
    mood: 'neutral',
    primaryColor: '#4A90E2', // Professional blue
    gestureBehavior: {
      frequency: 'moderate',
      style: 'precise',
      favoriteGestures: ['index', 'ok', 'handup'],
      confidenceMultiplier: 1.0,
      intervalWords: 40
    },
    idleGestures: ['index']
  },

  maya: {
    id: 'maya',
    name: 'Ara',
    description: 'Warm and approachable',
    avatar: '/avatars/Ara.glb',
    voice: 'Ara', // Warm, friendly
    gender: 'female',
    body: 'F',
    personality: {
      openness: 70,          // Creative
      conscientiousness: 50, // Balanced
      extraversion: 75,      // Very outgoing
      agreeableness: 90,     // Highly agreeable
      neuroticism: 35        // Calm
    },
    mood: 'happy',
    primaryColor: '#F59E42', // Warm orange
    gestureBehavior: {
      frequency: 'high',
      style: 'expressive',
      favoriteGestures: ['thumbup', 'namaste', 'ok'],
      confidenceMultiplier: 1.2,
      intervalWords: 30
    },
    idleGestures: ['thumbup', 'ok']
  },

  jordan: {
    id: 'jordan',
    name: 'Eve',
    description: 'Imaginative and energetic',
    avatar: '/avatars/Eve.glb',
    voice: 'Eve', // Energetic, upbeat
    gender: 'non-binary',
    body: 'F',
    personality: {
      openness: 95,          // Highly creative
      conscientiousness: 40, // Flexible
      extraversion: 80,      // Very energetic
      agreeableness: 60,     // Friendly
      neuroticism: 45        // Moderate
    },
    mood: 'happy',
    primaryColor: '#E74C3C', // Creative red
    gestureBehavior: {
      frequency: 'very high',
      style: 'animated',
      favoriteGestures: ['handup', 'side', 'thumbup'],
      confidenceMultiplier: 1.3,
      intervalWords: 25
    },
    idleGestures: ['side']
  },

  sam: {
    id: 'sam',
    name: 'Sal',
    description: 'Logical and precise',
    avatar: '/avatars/Sal.glb',
    voice: 'Sal', // Smooth, balanced
    gender: 'male',
    body: 'M',
    personality: {
      openness: 55,          // Balanced
      conscientiousness: 75, // Organized
      extraversion: 35,      // Reserved
      agreeableness: 30,     // Direct/analytical
      neuroticism: 20        // Very stable
    },
    mood: 'neutral',
    primaryColor: '#7F8C8D', // Neutral gray
    gestureBehavior: {
      frequency: 'low',
      style: 'minimal',
      favoriteGestures: ['index', 'shrug'],
      confidenceMultiplier: 0.7,
      intervalWords: 60
    },
    idleGestures: ['shrug']
  },

  riley: {
    id: 'riley',
    name: 'Leo',
    description: 'Sensitive and thoughtful',
    avatar: '/avatars/Leo.glb',
    voice: 'Leo', // Authoritative but caring
    gender: 'non-binary',
    body: 'F',
    personality: {
      openness: 65,          // Creative
      conscientiousness: 55, // Balanced
      extraversion: 45,      // Slightly reserved
      agreeableness: 85,     // Very empathetic
      neuroticism: 70        // Emotionally expressive
    },
    mood: 'love',
    primaryColor: '#9B59B6', // Empathetic purple
    gestureBehavior: {
      frequency: 'moderate',
      style: 'balanced',
      favoriteGestures: ['namaste', 'ok', 'thumbup'],
      confidenceMultiplier: 0.9,
      intervalWords: 45
    },
    idleGestures: ['namaste']
  }
};

/**
 * Get character by ID
 */
export function getCharacter(id: string): Character {
  return CHARACTERS[id] || CHARACTERS.alex;
}

/**
 * Get all characters as array
 */
export function getAllCharacters(): Character[] {
  return Object.values(CHARACTERS);
}

/**
 * Get character IDs
 */
export function getCharacterIds(): string[] {
  return Object.keys(CHARACTERS);
}
