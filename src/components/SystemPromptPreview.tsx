"use client";

interface SystemPromptPreviewProps {
  prompt: string;
}

export function SystemPromptPreview({ prompt }: SystemPromptPreviewProps) {
  return (
    <div className="card p-5">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.2em] mb-2">
        Generated System Prompt
      </h2>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{prompt}</p>
    </div>
  );
}
