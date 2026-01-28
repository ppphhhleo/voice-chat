import type { GestureAnalyzer, GestureEvent, AnalyzerContext, GestureName } from "../types";

// Adds natural gestures based on speech rhythm and pacing
// Triggers gestures at natural pause points (sentence boundaries, lists, etc.)
export class RhythmAnalyzer implements GestureAnalyzer {
  name = "rhythm";

  private wordCount = 0;
  private sentenceCount = 0;
  private gestureInterval: number; // words between gestures
  private naturalGestures: GestureName[] = ["index", "side", "handup"];

  constructor(options?: { gestureInterval?: number }) {
    this.gestureInterval = options?.gestureInterval ?? 40; // gesture every ~40 words
  }

  analyze(context: AnalyzerContext): GestureEvent[] {
    const events: GestureEvent[] = [];
    const text = context.newText;

    // Count new words
    const newWords = text.split(/\s+/).filter((w) => w.length > 0).length;
    this.wordCount += newWords;

    // Count sentence endings
    const sentences = (text.match(/[.!?]+/g) || []).length;
    this.sentenceCount += sentences;

    // Trigger gesture at intervals for natural rhythm
    if (this.wordCount >= this.gestureInterval) {
      this.wordCount = 0;

      // Pick a gesture not recently used
      const available = this.naturalGestures.filter(
        (g) => !context.recentGestures.includes(g)
      );

      if (available.length > 0) {
        const gesture = available[Math.floor(Math.random() * available.length)];
        events.push({
          gesture,
          duration: 1.5,
          confidence: 0.3,
          source: this.name,
        });
      }
    }

    return events;
  }

  reset() {
    this.wordCount = 0;
    this.sentenceCount = 0;
  }
}
