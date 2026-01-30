"use client";

interface ConnectionControlsProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  userSpeaking: boolean;
  connectionError: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function ConnectionControls({
  isConnected,
  isListening,
  isSpeaking,
  userSpeaking,
  connectionError,
  onStart,
  onStop,
}: ConnectionControlsProps) {
  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        {!isConnected ? (
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center rounded-full bg-[#22c55e] text-white w-14 h-14 text-lg font-semibold shadow-[var(--card-shadow)] transition hover:brightness-110 active:scale-95"
            aria-label="Start call"
          >
            📞
          </button>
        ) : (
          <button
            onClick={onStop}
            className="inline-flex items-center justify-center rounded-full bg-[#ef4444] text-white w-14 h-14 text-lg font-semibold shadow-[var(--card-shadow)] transition hover:brightness-110 active:scale-95"
            aria-label="End call"
          >
            📴
          </button>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isConnected ? "bg-[var(--accent)]" : "bg-muted"
            }`}
          />
          <span className="text-[var(--muted)]">
            {!isConnected && "Disconnected"}
            {isConnected && !isListening && "Connecting..."}
            {isListening && !userSpeaking && !isSpeaking && "Listening..."}
          </span>
          {userSpeaking && (
            <span className="text-[#fbbf24] font-medium animate-pulse">
              You are speaking...
            </span>
          )}
          {isSpeaking && (
            <span className="text-[var(--accent)] font-medium animate-pulse">
              Grok is speaking...
            </span>
          )}
        </div>
      </div>

      {connectionError && (
        <p className="text-[#fecdd3] text-sm mt-3 bg-[rgba(248,113,113,0.12)] px-4 py-2 rounded-lg border border-[#f87171]/40">
          {connectionError}
        </p>
      )}
    </>
  );
}
