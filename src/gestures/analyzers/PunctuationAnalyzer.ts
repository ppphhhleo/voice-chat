import type { GestureAnalyzer, GestureEvent, AnalyzerContext } from "../types";

// Trigger gestures based on sentence structure and punctuation
export class PunctuationAnalyzer implements GestureAnalyzer {
  name = "punctuation";

  private questionProbability: number;
  private exclamationProbability: number;

  constructor(options?: { questionProbability?: number; exclamationProbability?: number }) {
    this.questionProbability = options?.questionProbability ?? 0.3;
    this.exclamationProbability = options?.exclamationProbability ?? 0.2;
  }

  analyze(context: AnalyzerContext): GestureEvent[] {
    const events: GestureEvent[] = [];
    const text = context.newText;

    // Questions often come with uncertainty gestures
    if (text.includes("?") && Math.random() < this.questionProbability) {
      if (!context.recentGestures.includes("shrug")) {
        events.push({
          gesture: "shrug",
          duration: 2,
          confidence: 0.4,
          source: this.name,
        });
      }
    }

    // Exclamations can trigger emphasis
    if (text.includes("!") && Math.random() < this.exclamationProbability) {
      if (!context.recentGestures.includes("handup")) {
        events.push({
          gesture: "handup",
          duration: 1.5,
          confidence: 0.3,
          source: this.name,
        });
      }
    }

    return events;
  }
}
