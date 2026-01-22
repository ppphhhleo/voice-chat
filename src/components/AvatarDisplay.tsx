"use client";

export function AvatarDisplay() {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Avatar</p>
          <p className="text-sm text-[var(--muted)]">3D preview placeholder</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[rgba(138,180,248,0.12)] text-[var(--accent)] font-semibold">
          Coming Soon
        </span>
      </div>
      <div className="relative rounded-2xl border border-[var(--outline)] bg-[radial-gradient(circle_at_20%_20%,rgba(138,180,248,0.15),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(90,155,255,0.12),transparent_40%),var(--surface-1)] aspect-square overflow-hidden">
        <div className="absolute inset-0 opacity-60 bg-[linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 40%)]" />
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-[0.12]">
          {Array.from({ length: 64 }).map((_, i) => (
            <span key={i} className="border border-[rgba(231,237,247,0.08)]" />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-[rgba(138,180,248,0.6)] bg-[rgba(138,180,248,0.12)] shadow-[0_0_30px_rgba(90,155,255,0.4)]" />
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] text-[var(--muted)]">
          Drop your 3D canvas here
        </div>
      </div>
    </div>
  );
}
