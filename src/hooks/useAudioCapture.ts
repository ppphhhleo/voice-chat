import { useRef, useCallback, MutableRefObject } from "react";
import { SAMPLE_RATE } from "@/constants";

// Track which AudioContexts have the worklet registered (persists across re-renders)
const registeredContexts = new WeakSet<AudioContext>();

export function useAudioCapture(
  audioContextRef: MutableRefObject<AudioContext | null>,
  onAudioData: (base64: string) => void
) {
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const onAudioDataRef = useRef(onAudioData);
  onAudioDataRef.current = onAudioData;

  const setupAudioCapture = useCallback(
    async (stream: MediaStream) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      }
      const ctx = audioContextRef.current;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Only register the worklet once per AudioContext
      if (!registeredContexts.has(ctx)) {
        const workletCode = `
        class AudioProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0];
            if (input && input[0]) {
              const samples = input[0];
              const pcm16 = new Int16Array(samples.length);
              for (let i = 0; i < samples.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32768)));
              }
              this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
            }
            return true;
          }
        }
        registerProcessor('audio-processor', AudioProcessor);
      `;

        const blob = new Blob([workletCode], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        registeredContexts.add(ctx);
      }

      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "audio-processor");

      workletNode.port.onmessage = (e) => {
        const pcmData = new Uint8Array(e.data);
        const base64 = btoa(String.fromCharCode(...pcmData));
        onAudioDataRef.current(base64);
      };

      source.connect(workletNode);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(ctx.destination);

      sourceNodeRef.current = source;
      workletNodeRef.current = workletNode;
    },
    [audioContextRef]
  );

  const cleanupAudioCapture = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
  }, []);

  return { setupAudioCapture, cleanupAudioCapture };
}
