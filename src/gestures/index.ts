// Types
export * from "./types";

// Main hook
export { useGestureController } from "./useGestureController";

// Analyzers
export * from "./analyzers";

// Preset configurations
import { KeywordAnalyzer } from "./analyzers/KeywordAnalyzer";
import { PunctuationAnalyzer } from "./analyzers/PunctuationAnalyzer";
import { RhythmAnalyzer } from "./analyzers/RhythmAnalyzer";
import { MarkerAnalyzer } from "./analyzers/MarkerAnalyzer";
import type { GestureAnalyzer } from "./types";

// Default analyzer set - keywords + punctuation + rhythm
export function createDefaultAnalyzers(): GestureAnalyzer[] {
  return [
    new KeywordAnalyzer(),
    new PunctuationAnalyzer(),
    new RhythmAnalyzer(),
  ];
}

// Minimal set - just keywords
export function createMinimalAnalyzers(): GestureAnalyzer[] {
  return [new KeywordAnalyzer()];
}

// Full set - all analyzers including LLM markers
export function createFullAnalyzers(): GestureAnalyzer[] {
  return [
    new MarkerAnalyzer(), // Highest priority - explicit markers
    new KeywordAnalyzer(),
    new PunctuationAnalyzer(),
    new RhythmAnalyzer(),
  ];
}
