"use client";

import { Message } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="card p-5 h-72 overflow-y-auto">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(138,180,248,0.12)] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-[var(--muted)] text-sm">
            Click &quot;Start Conversation&quot; to begin.
            <br />
            <span className="text-xs text-[var(--muted)]">
              Requires: python server.py running on port 8000
            </span>
          </p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-[var(--accent)] text-[var(--surface)] rounded-br-md"
                : "bg-[var(--surface-2)] text-[var(--on-surface)] rounded-bl-md"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}
