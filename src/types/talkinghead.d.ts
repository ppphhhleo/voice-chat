declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    constructor(container: HTMLElement, options?: Record<string, unknown>);
    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: ((ev: ProgressEvent) => void) | null,
      onpreprocess?: (() => void) | null
    ): Promise<void>;
    setMood(mood: string): void;
    setView(view: "full" | "mid" | "upper" | "head"): void;
    start(): void;
    stop(): void;
    stopSpeaking(): void;
    playAnimation(
      url: string,
      onprogress?: ((ev: ProgressEvent) => void) | null,
      dur?: number,
      ndx?: number,
      scale?: number
    ): Promise<void>;
    playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void;
    lookAtCamera(time?: number): void;
    streamStart(
      opt?: Record<string, unknown>,
      onAudioStart?: (() => void) | null,
      onAudioEnd?: (() => void) | null,
      onSubtitles?: (() => void) | null,
      onMetrics?: (() => void) | null
    ): Promise<void>;
    streamAudio(data: {
      audio?: Int16Array | Float32Array | ArrayBuffer | Uint8Array;
      visemes?: unknown;
      anims?: unknown;
      words?: string[];
      wtimes?: number[];
      wdurations?: number[];
    }): void;
    streamNotifyEnd(): void;
    streamInterrupt(): void;
    isSpeaking: boolean;
    isStreaming: boolean;
  }
}
