// app/dashboard/tracks/[trackId]/TrackHeader.tsx
"use client";

type Props = {
  track: {
    id: string;
    title: string;
    description: string | null;
  };
  progress: number; // 0–1
};

export default function TrackHeader({ track, progress }: Props) {
  const pct = Math.round((progress || 0) * 100);

  return (
    <header className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Leadership Track
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-50 md:text-xl">
            {track.title}
          </h1>
          {track.description && (
            <p className="mt-1 max-w-xl text-xs text-slate-400">
              {track.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
            Leadership Level 1
          </span>
          <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-100 hover:border-emerald-500/60">
            View Requirements
          </button>
          <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-100 hover:border-emerald-500/60">
            Download PDF Summary
          </button>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-1 text-[11px] text-slate-500">
        {pct}% complete · Preceptor → Field Supervisor journey
      </p>
    </header>
  );
}
