"use client";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function TextInput({ value, onChange, onSend, disabled }: TextInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="Type a message..."
        className="flex-1 bg-[var(--surface-2)] border border-[var(--outline)] rounded-full px-5 py-2.5 text-sm text-[var(--on-surface)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-sm disabled:opacity-50"
        disabled={disabled}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="bg-[var(--accent)] text-surface w-11 h-11 rounded-full flex items-center justify-center shadow-[var(--card-shadow)] hover:-translate-y-[1px] disabled:opacity-40 transition-all active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
