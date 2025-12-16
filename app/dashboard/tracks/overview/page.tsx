// app/dashboard/tracks/overview/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Track = {
  id: string;
  title: string;
  description: string | null;
  org_id: string | null;
  created_at?: string;
};

type Assignment = {
  id: string;
  track_id: string;
  status: "assigned" | "in_progress" | "completed";
  due_date: string | null; // date
  completed_at: string | null; // timestamptz
  created_at: string;
};

type TrackCounts = {
  assigned: number;
  in_progress: number;
  completed: number;
  overdue: number;
  total: number;
};

const card = "rounded-2xl border border-border bg-card shadow-card";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

const input =
  "w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]";

const pill =
  "rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-foreground/70 shadow-sm";

function isManagerRole(role: string | null | undefined) {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "manager" || r === "dev";
}

function isOverdue(a: Assignment) {
  if (a.status === "completed") return false;
  if (!a.due_date) return false;

  // due_date is a date string, compare with today local
  const due = new Date(a.due_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function computeCounts(assignments: Assignment[]): TrackCounts {
  const assigned = assignments.filter((a) => a.status === "assigned").length;
  const in_progress = assignments.filter((a) => a.status === "in_progress").length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const overdue = assignments.filter((a) => isOverdue(a)).length;
  const total = assignments.length;

  return { assigned, in_progress, completed, overdue, total };
}

/* ---------------------------- Flow Diagram (SVG) ---------------------------- */

type FlowRow = {
  trackId: string;
  title: string;
  counts: TrackCounts;
};

function FlowDiagram({ rows }: { rows: FlowRow[] }) {
  // Layout constants
  const W = 980;
  const H = 420;

  const xBucket = 520;

  const bucketY = {
    assigned: 110,
    in_progress: 190,
    completed: 270,
    overdue: 350,
  } as const;

  const trackTop = 90;
  const trackSpacing = 56;

  const maxLink = Math.max(
    1,
    ...rows.flatMap((r) => [
      r.counts.assigned,
      r.counts.in_progress,
      r.counts.completed,
      r.counts.overdue,
    ])
  );

  function strokeFor(key: keyof TrackCounts) {
    if (key === "completed") return "rgba(16, 185, 129, 0.65)"; // emerald-500-ish
    if (key === "in_progress") return "rgba(45, 212, 191, 0.55)"; // teal-ish
    if (key === "assigned") return "rgba(148, 163, 184, 0.45)"; // slate
    if (key === "overdue") return "rgba(244, 63, 94, 0.55)"; // rose-500-ish
    return "rgba(148, 163, 184, 0.45)";
  }

  function widthFor(n: number) {
    const min = 3;
    const max = 18;
    const t = Math.sqrt(n / maxLink);
    return min + t * (max - min);
  }

  function curve(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const c1x = x1 + dx * 0.45;
    const c2x = x1 + dx * 0.65;
    return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
  }

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Flow view</h2>
          <p className="mt-1 text-sm text-foreground/60">
            MVP: Track → status buckets (assigned / in progress / completed / overdue).
          </p>
        </div>

        <span className={pill}>
          {rows.length} track{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* IMPORTANT: this wrapper gives the SVG a theme-aware base color via currentColor */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="rounded-2xl border border-border bg-muted/40 p-3 text-foreground shadow-sm">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
              <defs>
                {/* soft glow for links */}
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.25" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Column labels (theme-safe via currentColor) */}
              <text
                x={50}
                y={40}
                fontSize={11}
                fill="currentColor"
                opacity={0.55}
                fontWeight={800}
              >
                TRACKS
              </text>
              <text
                x={xBucket - 40}
                y={40}
                fontSize={11}
                fill="currentColor"
                opacity={0.55}
                fontWeight={800}
              >
                STATUS
              </text>

              {/* Bucket nodes */}
              {(
                [
                  ["assigned", "Assigned"],
                  ["in_progress", "In progress"],
                  ["completed", "Completed"],
                  ["overdue", "Overdue"],
                ] as const
              ).map(([key, label]) => (
                <g key={key}>
                  <rect
                    x={xBucket}
                    y={bucketY[key] - 18}
                    width={330}
                    height={34}
                    rx={16}
                    fill="rgba(255,255,255,0.06)"
                    stroke="rgba(148,163,184,0.25)"
                  />
                  <circle
                    cx={xBucket + 14}
                    cy={bucketY[key] - 2}
                    r={5}
                    fill={strokeFor(key)}
                  />
                  <text
                    x={xBucket + 28}
                    y={bucketY[key] + 5}
                    fontSize={12}
                    fill="currentColor"
                    opacity={0.75}
                    fontWeight={700}
                  >
                    {label}
                  </text>
                </g>
              ))}

              {/* Track nodes + links */}
              {rows.map((row, i) => {
                const y = trackTop + i * trackSpacing;

                const linkKeys: Array<keyof TrackCounts> = [
                  "assigned",
                  "in_progress",
                  "completed",
                  "overdue",
                ];

                return (
                  <g key={row.trackId}>
                    {/* Track node */}
                    <rect
                      x={30}
                      y={y - 16}
                      width={420}
                      height={34}
                      rx={16}
                      fill="rgba(255,255,255,0.06)"
                      stroke="rgba(148,163,184,0.25)"
                    />
                    <text
                      x={44}
                      y={y + 5}
                      fontSize={12}
                      fill="currentColor"
                      opacity={0.9}
                      fontWeight={750}
                    >
                      {row.title.length > 42 ? row.title.slice(0, 42) + "…" : row.title}
                    </text>

                    {/* Links */}
                    {linkKeys.map((k) => {
                      const n = row.counts[k] ?? 0;
                      if (!n) return null;

                      const x1 = 450;
                      const y1 =
                        y +
                        (k === "assigned"
                          ? -8
                          : k === "in_progress"
                          ? -3
                          : k === "completed"
                          ? 3
                          : 8);

                      const x2 = xBucket;
                      const y2 = bucketY[k as any];

                      return (
                        <path
                          key={k}
                          d={curve(x1, y1, x2, y2)}
                          fill="none"
                          stroke={strokeFor(k)}
                          strokeWidth={widthFor(n)}
                          strokeLinecap="round"
                          filter="url(#softGlow)"
                          opacity={0.9}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {rows.length === 0 && (
                <text x={40} y={120} fontSize={13} fill="currentColor" opacity={0.7}>
                  No tracks found.
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-foreground/50">
        Overdue is computed using due_date &lt; today for non-completed assignments.
      </p>
    </div>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function TracksOverviewPage() {
  const router = useRouter();
  const { org, organizationId, loading: orgLoading } = useOrg();
  const canManage = isManagerRole(org?.role);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Tracks (for now: org tracks + global templates)
      // If you want strict org-only, remove the `.or(...)` and use `.eq("org_id", organizationId)`
      let tq = supabase
        .from("tracks")
        .select("id, title, description, org_id, created_at")
        .order("created_at", { ascending: false });

      if (organizationId) {
        tq = tq.or(`org_id.eq.${organizationId},org_id.is.null`);
      }

      const { data: tData, error: tErr } = await tq;
      if (tErr) console.error("tracks load error:", tErr);

      // Assignments (org-scoped)
      let aq = supabase
        .from("track_assignments")
        .select("id, track_id, status, due_date, completed_at, created_at")
        .order("created_at", { ascending: false });

      if (organizationId) aq = aq.eq("org_id", organizationId);

      const { data: aData, error: aErr } = await aq;
      if (aErr) console.error("assignments load error:", aErr);

      setTracks((tData as Track[]) || []);
      setAssignments((aData as Assignment[]) || []);
      setLoading(false);
    }

    load();
  }, [organizationId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredTracks = !q
      ? tracks
      : tracks.filter((t) => {
          const hay = `${t.title} ${t.description ?? ""}`.toLowerCase();
          return hay.includes(q);
        });

    const byTrack = new Map<string, Assignment[]>();
    for (const a of assignments) {
      if (!byTrack.has(a.track_id)) byTrack.set(a.track_id, []);
      byTrack.get(a.track_id)!.push(a);
    }

    return filteredTracks.map((t) => {
      const list = byTrack.get(t.id) || [];
      return {
        trackId: t.id,
        title: t.title,
        counts: computeCounts(list),
      };
    });
  }, [tracks, assignments, query]);

  const totalAssignments = useMemo(() => assignments.length, [assignments]);

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-foreground/60">Loading overview…</div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <div className={`${card} p-6 text-sm text-foreground/70`}>
            You don’t have access to the org-wide tracks overview.
          </div>
          <button className={btnSoft} onClick={() => router.push("/dashboard/tracks")}>
            Back to tracks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Tracks · Org Overview
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">10,000-ft Track View</h1>
            <p className="text-sm text-foreground/60">
              See how tracks are flowing into outcomes across your organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className={btnSoft} onClick={() => router.push("/dashboard/tracks")}>
              Back to tracks
            </button>
            <button className={btnPrimary} onClick={() => router.push("/dashboard/tracks/new")}>
              Create track
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className={`${card} p-4`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tracks…"
                className={input}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={pill}>{rows.length} track{rows.length === 1 ? "" : "s"}</span>
              <span className={pill}>{totalAssignments} assignment{totalAssignments === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>

        {/* Flow view (this was blank before) */}
        <FlowDiagram rows={rows} />

        {/* Track list summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.trackId} className={`${card} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-tight">{r.title}</h2>
                  <p className="mt-2 text-sm text-foreground/60">
                    {r.counts.total} assigned · {r.counts.completed} completed
                    {r.counts.overdue ? ` · ${r.counts.overdue} overdue` : ""}
                  </p>
                </div>

                <button
                  className={btnSoft}
                  onClick={() => router.push(`/dashboard/tracks/${r.trackId}`)}
                >
                  View
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={pill}>Assigned: {r.counts.assigned}</span>
                <span className={pill}>In progress: {r.counts.in_progress}</span>
                <span className={pill}>Completed: {r.counts.completed}</span>
                <span className="rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-200 shadow-sm">
                  Overdue: {r.counts.overdue}
                </span>
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className={`${card} p-6 text-sm text-foreground/60`}>
            No tracks found.
          </div>
        )}
      </div>
    </div>
  );
}
