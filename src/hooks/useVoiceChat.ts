import { useState, useRef, useCallback, useEffect } from "react";
import { Voice, Message } from "@/types";
import { SAMPLE_RATE } from "@/constants";
import { useAudioPlayback } from "./useAudioPlayback";
import { useAudioCapture } from "./useAudioCapture";

interface UseVoiceChatOptions {
  voice: Voice;
  systemPrompt: string;
}

export function useVoiceChat({ voice, systemPrompt }: UseVoiceChatOptions) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentUserMsgRef = useRef<number>(-1);

  const { isSpeaking, enqueueAudio, audioContextRef } = useAudioPlayback();

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

  const startConversation = useCallback(async () => {
    setConnectionError(null);

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
    } catch (err) {
      setConnectionError("Microphone access denied. Please allow microphone access.");
      console.error("Mic error:", err);
      return;
    }

    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = async () => {
      setIsConnected(true);

      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice,
            instructions: systemPrompt,
            turn_detection: { type: "server_vad" },
            audio: {
              input: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
              output: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
            },
          },
        })
      );

      if (mediaStreamRef.current) {
        await setupAudioCapture(mediaStreamRef.current);
        setIsListening(true);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS:", data.type);

      switch (data.type) {
        case "session.created":
        case "session.updated":
          console.log("Session ready");
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
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
              float32[i] = pcm16[i] / 32768;
            }
            enqueueAudio(float32);
          }
          break;
        }

        case "response.done":
          console.log("Response complete");
          break;

        case "error":
          console.error("Server error:", data.error);
          setConnectionError(data.error?.message || "Server error");
          break;

        default:
          if (!data.type?.startsWith("session.")) {
            console.log("Unhandled event:", data.type, data);
          }
      }
    };

    ws.onclose = (e) => {
      console.log("WS closed:", e.code, e.reason);
      setIsConnected(false);
      setIsListening(false);
      setUserSpeaking(false);
      if (e.code !== 1000) {
        setConnectionError(`Connection closed: ${e.reason || e.code}`);
      }
    };

    ws.onerror = () => {
      setConnectionError("Connection failed. Is the Python server running? (python server.py)");
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [voice, systemPrompt, setupAudioCapture, enqueueAudio]);

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
      wsRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice,
            instructions: systemPrompt,
            turn_detection: { type: "server_vad" },
            audio: {
              input: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
              output: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
            },
          },
        })
      );
    }
  }, [voice, systemPrompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return {
    messages,
    isConnected,
    isListening,
    isSpeaking,
    userSpeaking,
    connectionError,
    startConversation,
    stopConversation,
    sendTextMessage,
    input,
    setInput,
  };
}
