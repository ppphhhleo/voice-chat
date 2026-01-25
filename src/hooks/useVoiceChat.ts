import { useState, useRef, useCallback, useEffect } from "react";
import { Voice, Message } from "@/types";
import { SAMPLE_RATE } from "@/constants";
import { useAudioPlayback } from "./useAudioPlayback";
import { useAudioCapture } from "./useAudioCapture";

const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";

export interface AudioStreamHandler {
  onStart: () => void;
  onAudio: (pcm16: Int16Array) => void;
  onEnd: () => void;
}

interface UseVoiceChatOptions {
  voice: Voice;
  systemPrompt: string;
  audioStreamHandler?: AudioStreamHandler | null;
}

async function fetchEphemeralToken(): Promise<string> {
  const res = await fetch("/api/token", { method: "POST" });
  const data = await res.json();
  if (!data.success || !data.token) {
    throw new Error(data.error || "Failed to get authentication token");
  }
  return data.token;
}

export function useVoiceChat({ voice, systemPrompt, audioStreamHandler }: UseVoiceChatOptions) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentUserMsgRef = useRef<number>(-1);
  const responseActiveRef = useRef(false);
  const audioStreamHandlerRef = useRef(audioStreamHandler);
  audioStreamHandlerRef.current = audioStreamHandler;

  const { isSpeaking: isSpeakingFallback, enqueueAudio, audioContextRef } = useAudioPlayback();

  const sendAudioData = useCallback((base64: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64,
        })
      );
    }
  }, []);

  const { setupAudioCapture, cleanupAudioCapture } = useAudioCapture(
    audioContextRef,
    sendAudioData
  );

  const sendSessionUpdate = useCallback((ws: WebSocket) => {
    ws.send(
      JSON.stringify({
        type: "session.update",
        session: {
          voice,
          instructions: systemPrompt,
          turn_detection: { type: "server_vad" },
          input_audio_transcription: { model: "grok-2-latest" },
          audio: {
            input: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
            output: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
          },
        },
      })
    );
  }, [voice, systemPrompt]);

  const handleMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "session.created":
      case "session.updated":
        break;

      case "input_audio_buffer.speech_started":
        setUserSpeaking(true);
        setMessages((prev) => {
          currentUserMsgRef.current = prev.length;
          return [...prev, { role: "user", content: "(listening...)" }];
        });
        break;

      case "input_audio_buffer.speech_stopped":
        setUserSpeaking(false);
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (data.transcript) {
          setMessages((prev) => {
            if (currentUserMsgRef.current >= 0 && currentUserMsgRef.current < prev.length) {
              const updated = [...prev];
              updated[currentUserMsgRef.current] = { role: "user", content: data.transcript };
              return updated;
            }
            return prev;
          });
        }
        break;

      case "response.audio_transcript.delta":
      case "response.output_audio_transcript.delta":
      case "response.text.delta": {
        const textDelta = data.delta;
        if (textDelta) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [...prev.slice(0, -1), { ...last, content: last.content + textDelta }];
            }
            return [...prev, { role: "assistant", content: textDelta }];
          });
        }
        break;
      }

      case "response.output_audio.delta":
      case "response.audio.delta": {
        const delta = data.delta;
        const encoded = typeof delta === "string" ? delta : delta?.data;
        if (encoded) {
          const binary = atob(encoded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const pcm16 = new Int16Array(bytes.buffer);

          const handler = audioStreamHandlerRef.current;
          if (handler) {
            if (!responseActiveRef.current) {
              responseActiveRef.current = true;
              setIsSpeaking(true);
              handler.onStart();
            }
            handler.onAudio(pcm16);
          } else {
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
              float32[i] = pcm16[i] / 32768;
            }
            enqueueAudio(float32);
          }
        }
        break;
      }

      case "response.done": {
        const handler = audioStreamHandlerRef.current;
        if (handler && responseActiveRef.current) {
          handler.onEnd();
        }
        responseActiveRef.current = false;
        setTimeout(() => setIsSpeaking(false), 500);
        break;
      }

      case "error":
        console.error("xAI error:", data.error);
        setConnectionError(data.error?.message || "Server error");
        break;
    }
  }, [enqueueAudio]);

  const startConversation = useCallback(async () => {
    setConnectionError(null);

    // 1. Request microphone access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
    } catch {
      setConnectionError("Microphone access denied. Please allow microphone access.");
      return;
    }

    // 2. Fetch ephemeral token from server (keeps API key secret)
    let token: string;
    try {
      token = await fetchEphemeralToken();
    } catch (err) {
      setConnectionError(
        err instanceof Error ? err.message : "Failed to authenticate"
      );
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      return;
    }

    // 3. Connect directly to xAI Realtime API with ephemeral token
    // Uses WebSocket subprotocol for auth (browser WebSocket doesn't support custom headers)
    const ws = new WebSocket(XAI_REALTIME_URL, [
      "realtime",
      `openai-insecure-api-key.${token}`,
    ]);

    ws.onopen = async () => {
      setIsConnected(true);
      sendSessionUpdate(ws);

      if (mediaStreamRef.current) {
        await setupAudioCapture(mediaStreamRef.current);
        setIsListening(true);
      }
    };

    ws.onmessage = handleMessage;

    ws.onclose = (e) => {
      setIsConnected(false);
      setIsListening(false);
      setUserSpeaking(false);
      if (e.code !== 1000) {
        setConnectionError(`Connection closed: ${e.reason || `code ${e.code}`}`);
      }
    };

    ws.onerror = () => {
      setConnectionError("WebSocket connection failed. Check your network or API configuration.");
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [sendSessionUpdate, setupAudioCapture, handleMessage]);

  const stopConversation = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    cleanupAudioCapture();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsListening(false);
    setUserSpeaking(false);
    setIsSpeaking(false);
    responseActiveRef.current = false;
  }, [cleanupAudioCapture]);

  const sendTextMessage = useCallback(() => {
    if (!input.trim() || !wsRef.current) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);

    wsRef.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: input }],
        },
      })
    );

    wsRef.current.send(
      JSON.stringify({
        type: "response.create",
        response: { modalities: ["text", "audio"] },
      })
    );

    setInput("");
  }, [input]);

  // Update session when voice/personality changes while connected
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendSessionUpdate(wsRef.current);
    }
  }, [sendSessionUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  const speakingState = audioStreamHandler ? isSpeaking : isSpeakingFallback;

  return {
    messages,
    isConnected,
    isListening,
    isSpeaking: speakingState,
    userSpeaking,
    connectionError,
    startConversation,
    stopConversation,
    sendTextMessage,
    input,
    setInput,
  };
}
