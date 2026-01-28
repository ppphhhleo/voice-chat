import type { GestureAnalyzer, GestureEvent, AnalyzerContext, GestureName } from "../types";

const VALID_GESTURES: GestureName[] = [
  "handup", "index", "ok", "thumbup", "thumbdown", "side", "shrug", "namaste"
];

// Parses explicit gesture markers in text: [GESTURE:thumbup], [gesture:shrug], etc.
// Useful when the LLM is prompted to include gesture annotations
export class MarkerAnalyzer implements GestureAnalyzer {
  name = "marker";

  private markerPattern = /\[gesture:(\w+)\]/gi;
  private stripMarkers: boolean;
  private onMarkerFound?: (gesture: GestureName, position: number) => void;

  constructor(options?: {
    stripMarkers?: boolean;
    onMarkerFound?: (gesture: GestureName, position: number) => void;
  }) {
    this.stripMarkers = options?.stripMarkers ?? true;
    this.onMarkerFound = options?.onMarkerFound;
  }

  analyze(context: AnalyzerContext): GestureEvent[] {
    const events: GestureEvent[] = [];
    let match;

    while ((match = this.markerPattern.exec(context.newText)) !== null) {
      const gestureName = match[1].toLowerCase() as GestureName;

      if (VALID_GESTURES.includes(gestureName)) {
        events.push({
          gesture: gestureName,
          duration: 2,
          confidence: 1.0, // Explicit markers have full confidence
          source: this.name,
        });

        this.onMarkerFound?.(gestureName, match.index);
      }
    }

    return events;
  }

  // Helper to strip markers from display text
  static stripMarkersFromText(text: string): string {
    return text.replace(/\[gesture:\w+\]/gi, "").trim();
  }
}
