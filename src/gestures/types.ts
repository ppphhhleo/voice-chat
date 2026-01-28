import type { BigFive } from "@/types";

// Available gestures in TalkingHead
export type GestureName =
  | "handup"
  | "index"
  | "ok"
  | "thumbup"
  | "thumbdown"
  | "side"
  | "shrug"
  | "namaste";

// A gesture event to be triggered
export interface GestureEvent {
  gesture: GestureName;
  duration: number;
  mirror?: boolean;
  confidence: number; // 0-1, how confident the analyzer is
  source: string; // which analyzer produced this
}

// Context passed to analyzers
export interface AnalyzerContext {
  // Text data
  fullText: string; // accumulated transcript
  newText: string; // just the new portion

  // Personality (optional)
  traits?: BigFive;

  // Timing
  isSpeaking: boolean;
  speechStartTime?: number;

  // Previous gestures (to avoid repetition)
  recentGestures: GestureName[];
}

// Base interface for gesture analyzers (plugin system)
export interface GestureAnalyzer {
  name: string;

  // Analyze context and return gesture events (or empty array)
  analyze(context: AnalyzerContext): GestureEvent[];

  // Optional: reset state between conversations
  reset?(): void;

  // Optional: cleanup resources
  dispose?(): void;
}

// Configuration for the gesture controller
export interface GestureControllerConfig {
  enabled: boolean;
  minGapMs: number; // minimum time between gestures
  maxQueueSize: number; // max gestures to queue

  // Personality modulation
  usePersonalityModulation: boolean;
}

export const DEFAULT_CONFIG: GestureControllerConfig = {
  enabled: true,
  minGapMs: 4000,
  maxQueueSize: 3,
  usePersonalityModulation: true,
};
