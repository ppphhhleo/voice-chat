import { useRef, useCallback, useEffect } from "react";
import type { BigFive } from "@/types";
import type {
  GestureAnalyzer,
  GestureEvent,
  AnalyzerContext,
  GestureControllerConfig,
  GestureName,
} from "./types";
import { DEFAULT_CONFIG } from "./types";

interface TalkingHeadLike {
  playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void;
}

interface UseGestureControllerOptions {
  headRef: React.RefObject<TalkingHeadLike | null>;
  analyzers: GestureAnalyzer[];
  traits?: BigFive;
  config?: Partial<GestureControllerConfig>;
}

export function useGestureController({
  headRef,
  analyzers,
  traits,
  config: configOverride,
}: UseGestureControllerOptions) {
  const config = { ...DEFAULT_CONFIG, ...configOverride };

  const lastGestureTimeRef = useRef<number>(0);
  const processedTextRef = useRef<string>("");
  const gestureQueueRef = useRef<GestureEvent[]>([]);
  const recentGesturesRef = useRef<GestureName[]>([]);
  const isSpeakingRef = useRef(false);
  const speechStartTimeRef = useRef<number | undefined>(undefined);

  // Adjust confidence based on personality
  const adjustConfidence = useCallback(
    (event: GestureEvent): number => {
      if (!config.usePersonalityModulation || !traits) {
        return event.confidence;
      }

      let modifier = 0;

      // Extraverts gesture more
      modifier += (traits.extraversion - 50) / 100;

      // Agreeable people use more positive gestures
      if (["thumbup", "ok", "namaste"].includes(event.gesture)) {
        modifier += (traits.agreeableness - 50) / 200;
      }

      // Neurotic people might gesture less confidently
      modifier -= (traits.neuroticism - 50) / 200;

      return Math.min(1, Math.max(0.1, event.confidence + modifier));
    },
    [traits, config.usePersonalityModulation]
  );

  // Execute a gesture
  const executeGesture = useCallback(
    (event: GestureEvent) => {
      const head = headRef.current;
      if (!head || !config.enabled) return false;

      head.playGesture(event.gesture, event.duration, event.mirror ?? false, 800);

      // Track recent gestures (keep last 3)
      recentGesturesRef.current.push(event.gesture);
      if (recentGesturesRef.current.length > 3) {
        recentGesturesRef.current.shift();
      }

      lastGestureTimeRef.current = Date.now();
      return true;
    },
    [headRef, config.enabled]
  );

  // Process the gesture queue
  const processQueue = useCallback(() => {
    if (!config.enabled) return;

    const now = Date.now();
    const timeSinceLastGesture = now - lastGestureTimeRef.current;

    if (
      gestureQueueRef.current.length > 0 &&
      timeSinceLastGesture >= config.minGapMs
    ) {
      // Sort by confidence, take highest
      gestureQueueRef.current.sort((a, b) => b.confidence - a.confidence);
      const event = gestureQueueRef.current.shift()!;

      // Apply personality modulation
      const adjustedConfidence = adjustConfidence(event);

      // Probabilistic trigger based on confidence
      if (Math.random() < adjustedConfidence) {
        executeGesture(event);
      }
    }
  }, [config.enabled, config.minGapMs, adjustConfidence, executeGesture]);

  // Queue processor interval
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(processQueue, 500);
    return () => clearInterval(interval);
  }, [config.enabled, processQueue]);

  // Main analysis function - call this with transcript updates
  const analyzeText = useCallback(
    (fullText: string) => {
      if (!config.enabled || !fullText) return;

      // Determine new text portion
      const previousLength = processedTextRef.current.length;
      if (fullText.length <= previousLength) return;

      const newText = fullText.slice(previousLength);
      processedTextRef.current = fullText;

      // Build context for analyzers
      const context: AnalyzerContext = {
        fullText,
        newText,
        traits,
        isSpeaking: isSpeakingRef.current,
        speechStartTime: speechStartTimeRef.current,
        recentGestures: [...recentGesturesRef.current],
      };

      // Run all analyzers and collect events
      const allEvents: GestureEvent[] = [];
      for (const analyzer of analyzers) {
        try {
          const events = analyzer.analyze(context);
          allEvents.push(...events);
        } catch (err) {
          console.warn(`Gesture analyzer "${analyzer.name}" error:`, err);
        }
      }

      // Add to queue (respecting max size)
      for (const event of allEvents) {
        if (gestureQueueRef.current.length < config.maxQueueSize) {
          gestureQueueRef.current.push(event);
        }
      }
    },
    [config.enabled, config.maxQueueSize, analyzers, traits]
  );

  // Notify when speech starts
  const onSpeechStart = useCallback(() => {
    isSpeakingRef.current = true;
    speechStartTimeRef.current = Date.now();
  }, []);

  // Notify when speech ends
  const onSpeechEnd = useCallback(() => {
    isSpeakingRef.current = false;
    speechStartTimeRef.current = undefined;
  }, []);

  // Reset state between conversations
  const reset = useCallback(() => {
    processedTextRef.current = "";
    gestureQueueRef.current = [];
    recentGesturesRef.current = [];
    isSpeakingRef.current = false;
    speechStartTimeRef.current = undefined;

    // Reset analyzers that support it
    for (const analyzer of analyzers) {
      analyzer.reset?.();
    }
  }, [analyzers]);

  // Manual gesture trigger (for presets, etc.)
  const triggerGesture = useCallback(
    (gesture: GestureName, duration = 2, mirror = false) => {
      executeGesture({
        gesture,
        duration,
        mirror,
        confidence: 1,
        source: "manual",
      });
    },
    [executeGesture]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const analyzer of analyzers) {
        analyzer.dispose?.();
      }
    };
  }, [analyzers]);

  return {
    analyzeText,
    triggerGesture,
    onSpeechStart,
    onSpeechEnd,
    reset,
  };
}
