import { useState, useRef, useCallback } from "react";
import { SAMPLE_RATE } from "@/constants";

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    const ctx = audioContextRef.current;

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!;
      const buffer = ctx.createBuffer(1, chunk.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(chunk);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const enqueueAudio = useCallback(
    (float32: Float32Array) => {
      audioQueueRef.current.push(float32);
      playAudioQueue();
    },
    [playAudioQueue]
  );

  return { isSpeaking, enqueueAudio, audioContextRef };
}
