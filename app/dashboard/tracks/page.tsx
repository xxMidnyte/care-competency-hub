// app/dashboard/tracks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Track = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  created_at?: string;
};

type Assignment = {
  id: string;
  track_id: string;
  status: "assigned" | "in_progress" | "completed" | string;
  due_date: string | null; // date
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

function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isOverdue(due_date: string | null, status: string) {
  if (!due_date) return false;
  if (status === "completed") return false;
  const due = new Date(`${due_date}T00:00:00`);
  return due.getTime() < startOfToday().getTime();
}

function fmtCreated(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `Created ${d.toLocaleDateString()}`;
}

export default function TracksPage() {
  const router = useRouter();
  const { org, loading: orgLoading } = useOrg();
  const canManage = isManagerRole(org?.role ?? null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "az">("new");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: tData, error: tErr } = await supabase
        .from("tracks")
        .select("id, title, slug, description, created_at")
        .order("created_at", { ascending: sort === "old" });

      if (tErr) console.error("Tracks load error:", tErr);
      setTracks((tData as Track[]) || []);

      // Pull assignments once so we can show “10k foot” counts on this page.
      const { data: aData, error: aErr } = await supabase
        .from("track_assignments")
        .select("id, track_id, status, due_date");

      if (aErr) console.error("Assignments load error:", aErr);
      setAssignments((aData as Assignment[]) || []);

      setLoading(false);
    }

    load();
  }, [sort]);

  const countsByTrack = useMemo(() => {
    const map: Record<string, TrackCounts> = {};

    for (const t of tracks) {
      map[t.id] = { assigned: 0, in_progress: 0, completed: 0, overdue: 0, total: 0 };
    }

    for (const a of assignments) {
      const row = map[a.track_id];
      if (!row) continue;

      row.total += 1;
      if (a.status === "assigned") row.assigned += 1;
      else if (a.status === "in_progress") row.in_progress += 1;
      else if (a.status === "completed") row.completed += 1;

      if (isOverdue(a.due_date, a.status)) row.overdue += 1;
    }

    return map;
  }, [tracks, assignments]);

  const orgTotals = useMemo(() => {
    let total = 0,
      overdue = 0,
      completed = 0;

    for (const a of assignments) {
      total += 1;
      if (a.status === "completed") completed += 1;
      if (isOverdue(a.due_date, a.status)) overdue += 1;
    }

    return { total, overdue, completed };
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;

    return tracks.filter((t) => {
      const hay = `${t.title ?? ""} ${t.description ?? ""} ${t.slug ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tracks, query]);

  const sorted = useMemo(() => {
    if (sort === "az") {
      return [...filtered].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return filtered;
  }, [filtered, sort]);

  const showSkeleton = loading || orgLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Tracks
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Growth Tracks</h1>
            <p className="text-sm text-foreground/60">
              Assign structured learning journeys and track progress across your team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <>
                <button type="button" onClick={() => router.push("/dashboard/tracks/overview")} className={btnSoft}>
                  Org Overview
                </button>
                <button type="button" onClick={() => router.push("/dashboard/tracks/new")} className={btnPrimary}>
                  Create track
                </button>
              </>
            ) : (
              <span className={pill} aria-hidden>
                Your tracks
              </span>
            )}
          </div>
        </div>

        {/* 10k-foot mini KPI row */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${card} p-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Total assignments
            </p>
            <p className="mt-2 text-2xl font-semibold">{orgTotals.total}</p>
            <p className="mt-1 text-sm text-foreground/60">
              Across all tracks
            </p>
          </div>

          <div className={`${card} p-4 border-rose-500/25 bg-rose-500/10`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200/80">
              Overdue
            </p>
            <p className="mt-2 text-2xl font-semibold text-rose-200">{orgTotals.overdue}</p>
            <p className="mt-1 text-sm text-foreground/60">
              Due date passed
            </p>
          </div>

          <div className={`${card} p-4 border-emerald-500/25 bg-emerald-500/10`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
              Completed
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">{orgTotals.completed}</p>
            <p className="mt-1 text-sm text-foreground/60">
              Finished assignments
            </p>
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
              <span className={pill}>
                {sorted.length} track{sorted.length === 1 ? "" : "s"}
              </span>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]"
              >
                <option value="new">Newest</option>
                <option value="old">Oldest</option>
                <option value="az">A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {showSkeleton ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${card} p-4`}>
                <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-foreground/10" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-foreground/10" />
                <div className="mt-6 h-8 w-28 animate-pulse rounded-full bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((track) => {
                const c = countsByTrack[track.id] || {
                  assigned: 0,
                  in_progress: 0,
                  completed: 0,
                  overdue: 0,
                  total: 0,
                };

                return (
                  <div key={track.id} className={`${card} p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold leading-tight">{track.title}</h2>

                        {track.description ? (
                          <p className="mt-2 line-clamp-3 text-sm text-foreground/60">
                            {track.description}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-foreground/50">No description yet.</p>
                        )}
                      </div>

                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/60">
                        {c.total} assigned
                      </span>
                    </div>

                    {/* mini status chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/70">
                        Assigned: {c.assigned}
                      </span>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/70">
                        In progress: {c.in_progress}
                      </span>
                      <span className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200">
                        Overdue: {c.overdue}
                      </span>
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                        Completed: {c.completed}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/tracks/${track.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
                      >
                        View
                      </Link>

                      {canManage && (
                        <>
                          <Link href={`/dashboard/tracks/${track.id}/assign`} className={btnSoft}>
                            Assign
                          </Link>
                          <Link href={`/dashboard/tracks/${track.id}/builder`} className={btnSoft}>
                            Builder
                          </Link>
                          <Link href={`/dashboard/tracks/${track.id}/analytics`} className={btnSoft}>
                            Analytics
                          </Link>
                        </>
                      )}
                    </div>

                    <p className="mt-4 text-[11px] text-foreground/50">
                      {fmtCreated(track.created_at) || " "}
                    </p>
                  </div>
                );
              })}
            </div>

            {sorted.length === 0 && (
              <div className={`${card} p-6 text-sm text-foreground/60`}>
                {query.trim() ? (
                  <span>No tracks match your search.</span>
                ) : canManage ? (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground/70">
                      No tracks yet. Build your first “clinical growth journey” and start assigning it.
                    </p>
                    <button className={btnPrimary} onClick={() => router.push("/dashboard/tracks/new")}>
                      Create your first track
                    </button>
                  </div>
                ) : (
                  <span>No tracks found yet.</span>
                )}
              </div>
            )}

            {/* Friendly next step hint */}
            {sorted.length > 0 && canManage && (
              <div className={`${card} p-5`}>
                <p className="text-sm text-foreground/70">
                  Next: open a track and hit <span className="font-semibold">Builder</span> to add
                  sections + modules. Then use <span className="font-semibold">Org Overview</span> for
                  the 10,000-ft flow.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
