// app/dashboard/facility/[facilityId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type FacilityStats = {
  facility_id: string;
  total_assigned: number;
  total_completed: number;
  overdue_count: number;
  percentage_complete: number;
};

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl space-y-6",
  card: "rounded-2xl border border-border bg-card shadow-card",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  h1: "text-2xl font-semibold tracking-tight",
  p: "text-sm text-foreground/60",
  stat: "text-3xl font-semibold tracking-tight text-foreground",
  pillBase:
    "mt-3 inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold",
  pillOk: "border-border bg-muted/30 text-foreground/70",
  pillBad: "border-red-500/30 bg-red-500/10 text-red-500",
  barTrack: "mt-3 h-2 w-full rounded-full bg-muted/30",
  barFill: "h-2 rounded-full bg-primary",
  btnSoft:
    "inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-card transition hover:opacity-90",
  err:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground",
};

function clampPct(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return Math.min(100, Math.max(0, n));
}

export default function FacilityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.facilityId as string;

  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pct = useMemo(
    () => clampPct(stats?.percentage_complete ?? 0),
    [stats?.percentage_complete]
  );

  useEffect(() => {
    if (!facilityId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/dashboard/facility/${facilityId}/stats`);
        const json = await res.json().catch(() => null);

        if (!res.ok || !json) {
          console.error("Facility stats error:", json);
          setError("Unable to load facility stats.");
          setStats(null);
          return;
        }

        setStats(json as FacilityStats);
      } catch (err) {
        console.error("Facility stats fetch failed:", err);
        setError("Unable to load facility stats.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [facilityId]);

  if (loading) {
    return (
      <div className={ui.page}>
        <div className="text-sm text-foreground/60">Loading facility dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={ui.page}>
        <div className={ui.err}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-red-500">Couldn’t load dashboard</p>
              <p className="mt-1 text-xs text-foreground/70">{error}</p>
            </div>
            <button className={ui.btnSoft} onClick={() => router.back()}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={ui.page}>
        <div className={`${ui.card} p-5`}>
          <div className={ui.label}>Facility dashboard</div>
          <h1 className="mt-1 text-lg font-semibold">No data yet</h1>
          <p className="mt-1 text-sm text-foreground/60">
            No assignment data found for this facility yet.
          </p>
          <div className="mt-4">
            <button className={ui.btnSoft} onClick={() => router.back()}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={ui.label}>Facility dashboard</div>
            <h1 className={`${ui.h1} mt-1`}>Progress snapshot</h1>
            <p className={`${ui.p} mt-1`}>
              Quick view of assignments, completion, and overdue risk for this facility.
            </p>
          </div>

          <button className={ui.btnSoft} onClick={() => router.back()}>
            Back
          </button>
        </div>

        {/* Snapshot cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total assigned */}
          <div className={`${ui.card} p-5`}>
            <div className={ui.label}>Total assigned</div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className={ui.stat}>{stats.total_assigned ?? 0}</p>
              <p className="text-xs text-foreground/60">assignments</p>
            </div>
            <p className="mt-2 text-xs text-foreground/60">
              Total competency assignments currently tracked.
            </p>
          </div>

          {/* % complete */}
          <div className={`${ui.card} p-5`}>
            <div className={ui.label}>Completion</div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className={ui.stat}>{pct}%</p>
              <p className="text-xs text-foreground/60">
                ({stats.total_completed ?? 0} completed)
              </p>
            </div>

            <div className={ui.barTrack} aria-hidden="true">
              <div className={ui.barFill} style={{ width: `${pct}%` }} />
            </div>

            <p className="mt-2 text-xs text-foreground/60">
              Based on completed vs assigned.
            </p>
          </div>

          {/* Overdue */}
          <div className={`${ui.card} p-5`}>
            <div className={ui.label}>Overdue</div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className={ui.stat}>{stats.overdue_count ?? 0}</p>
              <p className="text-xs text-foreground/60">items</p>
            </div>

            <span
              className={[
                ui.pillBase,
                (stats.overdue_count ?? 0) > 0 ? ui.pillBad : ui.pillOk,
              ].join(" ")}
            >
              {(stats.overdue_count ?? 0) > 0 ? "Action needed" : "No overdue assignments"}
            </span>

            <p className="mt-2 text-xs text-foreground/60">
              Overdue items should be prioritized for compliance.
            </p>
          </div>
        </div>

        {/* Next section placeholder (keeps polish consistent) */}
        <div className={`${ui.card} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Next: drill-down tables</h2>
              <p className="mt-1 text-xs text-foreground/60">
                Add “Overdue list”, “Due soon”, and “By discipline” tables under here.
              </p>
            </div>
            <span className="rounded-full border border-border bg-muted/30 px-2 py-1 text-[11px] font-semibold text-foreground/60">
              coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
