"use client";

import { useState } from "react";
import { BigFive, Voice } from "@/types";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { generateSystemPrompt } from "@/utils/personality";
import { VoiceSelector } from "@/components/VoiceSelector";
import { PersonalitySliders } from "@/components/PersonalitySliders";
import { SystemPromptPreview } from "@/components/SystemPromptPreview";
import { ConnectionControls } from "@/components/ConnectionControls";
import { ChatMessages } from "@/components/ChatMessages";
import { TextInput } from "@/components/TextInput";
import { AvatarDisplay } from "@/components/AvatarDisplay";

export default function Home() {
  const [voice, setVoice] = useState<Voice>("Ara");
  const [traits, setTraits] = useState<BigFive>({
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    neuroticism: 50,
  });

  const systemPrompt = generateSystemPrompt(traits);

  const chat = useVoiceChat({ voice, systemPrompt });

  return (
    <main className="max-w-5xl mx-auto px-5 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Realtime Voice</p>
          <h1 className="text-3xl font-semibold leading-tight">Grok Voice Chat</h1>
          <p className="text-sm text-[var(--muted)]">Material-inspired surfaces with personality-aware responses.</p>
        </div>
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
                chat.isConnected ? "bg-[var(--accent)]" : "bg-muted"
              }`}
            />
            {chat.isConnected ? "Live" : "Offline"}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {chat.isListening && !chat.userSpeaking && !chat.isSpeaking && "Listening"}
            {chat.userSpeaking && "You’re speaking"}
            {chat.isSpeaking && "Grok is replying"}
            {!chat.isConnected && "Awaiting connection"}
          </span>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <AvatarDisplay />
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          <VoiceSelector voice={voice} onVoiceChange={setVoice} />
          <PersonalitySliders traits={traits} onTraitsChange={setTraits} />
        </div>
      </div>

      <SystemPromptPreview prompt={systemPrompt} />

      <ConnectionControls
        isConnected={chat.isConnected}
        isListening={chat.isListening}
        isSpeaking={chat.isSpeaking}
        userSpeaking={chat.userSpeaking}
        connectionError={chat.connectionError}
        onStart={chat.startConversation}
        onStop={chat.stopConversation}
      />

      <ChatMessages messages={chat.messages} />

      <TextInput
        value={chat.input}
        onChange={chat.setInput}
        onSend={chat.sendTextMessage}
        disabled={!chat.isConnected}
      />
    </main>
  );
}
