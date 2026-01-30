"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { BigFive, Voice } from "@/types";
import { useVoiceChat, AudioStreamHandler } from "@/hooks/useVoiceChat";
import { generateSystemPrompt } from "@/utils/personality";
import { ConnectionControls } from "@/components/ConnectionControls";
import { ChatMessages } from "@/components/ChatMessages";
import { TextInput } from "@/components/TextInput";
import { AvatarGallery3D } from "@/components/AvatarGallery3D";
import { BVHAnimationPlayer } from "@/components/BVHAnimationPlayer";
import { Character, CHARACTERS } from "@/characters";
import {
  useGestureController,
  createDefaultAnalyzers,
  type GestureAnalyzer,
} from "@/gestures";
import type { TalkingHead } from "@met4citizen/talkinghead";

export default function Home() {
  // Start with Alex as default character
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS.alex);
  const [audioHandler, setAudioHandler] = useState<AudioStreamHandler | null>(null);

  // Extract voice and traits from selected character
  const voice = selectedCharacter.voice;
  const traits = selectedCharacter.personality;

  // TalkingHead reference for gesture control
  const headRef = useRef<TalkingHead | null>(null);

  // Create analyzers once (memoized)
  const analyzers = useMemo<GestureAnalyzer[]>(() => createDefaultAnalyzers(), []);

  // Gesture controller
  const { analyzeText, onSpeechStart, onSpeechEnd, reset: resetGestures } = useGestureController({
    headRef,
    analyzers,
    traits,
    config: {
      enabled: true,
      minGapMs: selectedCharacter.gestureBehavior.intervalWords
        ? (selectedCharacter.gestureBehavior.intervalWords / 2.5) * 1000
        : 4000,
      usePersonalityModulation: true,
    },
  });

  const systemPrompt = generateSystemPrompt(traits);

  // Transcript callback for gesture analysis
  const handleTranscript = useCallback(
    (text: string) => {
      analyzeText(text);
    },
    [analyzeText]
  );

  const chat = useVoiceChat({
    voice,
    systemPrompt,
    audioStreamHandler: audioHandler,
    onTranscript: handleTranscript,
  });

  const handleStreamReady = useCallback((handler: AudioStreamHandler | null) => {
    if (!handler) {
      setAudioHandler(null);
      return;
    }
    // Wrap the original handlers to also notify gesture controller
    const wrappedHandler: AudioStreamHandler = {
      onStart: () => {
        handler.onStart();
        onSpeechStart();
      },
      onAudio: handler.onAudio,
      onEnd: () => {
        handler.onEnd();
        onSpeechEnd();
        resetGestures();
      },
      onTranscript: handler.onTranscript, // Pass through for lipsync
    };
    setAudioHandler(wrappedHandler);
  }, [onSpeechStart, onSpeechEnd, resetGestures]);

  const handleCharacterChange = useCallback((character: Character) => {
    setSelectedCharacter(character);
    // Reset gestures when switching characters
    resetGestures();
  }, [resetGestures]);

  const handleHeadReady = useCallback((head: TalkingHead | null) => {
    headRef.current = head;
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-5 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Realtime Voice</p>
          <h1 className="text-3xl font-semibold leading-tight">Grok Voice Chat</h1>
          <p className="text-sm text-[var(--muted)]">Choose a character and start a conversation with unique personalities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                chat.isConnected
                  ? "bg-[rgba(138,180,248,0.12)] text-[var(--accent)]"
                  : "bg-[rgba(255,255,255,0.08)] text-[var(--muted)]"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  chat.isConnected ? "bg-[var(--accent)]" : "bg-[var(--muted)]"
                }`}
              />
              {chat.isConnected ? "Live" : "Offline"}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {chat.isListening && !chat.userSpeaking && !chat.isSpeaking && "Listening"}
              {chat.userSpeaking && "You're speaking"}
              {chat.isSpeaking && "Grok is replying"}
              {!chat.isConnected && "Awaiting connection"}
            </span>
          </div>
          <ConnectionControls
            isConnected={chat.isConnected}
            isListening={chat.isListening}
            isSpeaking={chat.isSpeaking}
            userSpeaking={chat.userSpeaking}
            connectionError={chat.connectionError}
            onStart={chat.startConversation}
            onStop={chat.stopConversation}
          />
        </div>
      </header>

      {/* 3D Avatar Gallery */}
      <AvatarGallery3D
        onCharacterChange={handleCharacterChange}
        onStreamReady={handleStreamReady}
        onHeadReady={handleHeadReady}
        initialCharacterId="alex"
      />

      {/* BVH Animation Player */}
      {headRef.current && (
        <BVHAnimationPlayer head={headRef.current} />
      )}

      {/* Chat Interface */}
      <div className="space-y-4">
        <ChatMessages messages={chat.messages} />
        <TextInput
          value={chat.input}
          onChange={chat.setInput}
          onSend={chat.sendTextMessage}
          disabled={!chat.isConnected}
        />
      </div>
    </main>
  );
}
