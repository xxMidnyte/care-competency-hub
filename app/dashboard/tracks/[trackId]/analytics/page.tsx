// app/dashboard/tracks/[trackId]/analytics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Track = {
  id: string;
  title: string | null;
  description: string | null;
};

type StaffMini = { id: string; full_name: string | null; email: string | null };
type FacilityMini = { id: string; name: string | null };

type AssignmentRow = {
  id: string;
  org_id: string;
  facility_id: string;
  staff_id: string;
  track_id: string;
  status: "assigned" | "in_progress" | "completed" | string;
  due_date: string | null; // date
  completed_at: string | null;
  created_at: string | null;

  // optional joined object if relationship exists:
  staff_members?: { full_name: string | null; email: string | null } | null;
  facilities?: { name: string | null } | null;
};

const card = "rounded-2xl border border-border bg-card shadow-card";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
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

function fmtDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function TrackAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const trackId = params?.trackId as string;

  const { org, loading: orgLoading } = useOrg();
  const canManage = isManagerRole(org?.role);

  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [joinOk, setJoinOk] = useState(true);

  // fallback maps (used when FK-join doesn’t exist)
  const [staffMap, setStaffMap] = useState<Record<string, StaffMini>>({});
  const [facilityMap, setFacilityMap] = useState<Record<string, FacilityMini>>(
    {}
  );

  useEffect(() => {
    if (!trackId) return;

    async function load() {
      setLoading(true);

      const { data: trackData, error: trackErr } = await supabase
        .from("tracks")
        .select("id, title, description")
        .eq("id", trackId)
        .single();

      if (trackErr) console.error("Track load error:", trackErr);
      setTrack((trackData as Track) || null);

      // Try a joined query first (works if FK relationships exist)
      const joinedSelect =
        "id, org_id, facility_id, staff_id, track_id, status, due_date, completed_at, created_at," +
        "staff_members(full_name,email)," +
        "facilities(name)";

      const { data: joined, error: joinErr } = await supabase
        .from("track_assignments")
        .select(joinedSelect)
        .eq("track_id", trackId)
        .order("created_at", { ascending: false });

      if (!joinErr && joined) {
        setRows(joined as AssignmentRow[]);
        setJoinOk(true);
        setLoading(false);
        return;
      }

      // Fallback: no joins
      console.warn("Joined assignment query failed, falling back:", joinErr);
      setJoinOk(false);

      const { data: plain, error: plainErr } = await supabase
        .from("track_assignments")
        .select(
          "id, org_id, facility_id, staff_id, track_id, status, due_date, completed_at, created_at"
        )
        .eq("track_id", trackId)
        .order("created_at", { ascending: false });

      if (plainErr) console.error("Assignments load error:", plainErr);

      const plainRows = (plain as AssignmentRow[]) || [];
      setRows(plainRows);

      // ✅ NEW: hydrate staff/facility names via two extra queries
      const staffIds = Array.from(
        new Set(plainRows.map((r) => r.staff_id).filter(Boolean))
      );
      const facilityIds = Array.from(
        new Set(plainRows.map((r) => r.facility_id).filter(Boolean))
      );

      // fetch staff in one go (chunk if needed later)
      if (staffIds.length) {
        const { data: staffRows, error: staffErr } = await supabase
          .from("staff_members")
          .select("id, full_name, email")
          .in("id", staffIds);

        if (staffErr) {
          console.error("Staff map load error:", staffErr);
        } else {
          const map: Record<string, StaffMini> = {};
          (staffRows as StaffMini[] | null)?.forEach((s) => (map[s.id] = s));
          setStaffMap(map);
        }
      } else {
        setStaffMap({});
      }

      // fetch facilities in one go
      if (facilityIds.length) {
        const { data: facRows, error: facErr } = await supabase
          .from("facilities")
          .select("id, name")
          .in("id", facilityIds);

        if (facErr) {
          console.error("Facility map load error:", facErr);
        } else {
          const map: Record<string, FacilityMini> = {};
          (facRows as FacilityMini[] | null)?.forEach((f) => (map[f.id] = f));
          setFacilityMap(map);
        }
      } else {
        setFacilityMap({});
      }

      setLoading(false);
    }

    load();
  }, [trackId]);

  const stats = useMemo(() => {
    let assigned = 0;
    let in_progress = 0;
    let completed = 0;
    let overdue = 0;

    for (const r of rows) {
      if (r.status === "assigned") assigned += 1;
      else if (r.status === "in_progress") in_progress += 1;
      else if (r.status === "completed") completed += 1;

      if (isOverdue(r.due_date, r.status)) overdue += 1;
    }

    return {
      assigned,
      in_progress,
      completed,
      overdue,
      total: rows.length,
    };
  }, [rows]);

  const title = track?.title || "Track";

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-foreground/60">
          Loading analytics…
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-rose-300">Track not found.</div>
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
              Tracks · Analytics
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-foreground/60">
              Org-level assignment stats and who’s on pace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push(`/dashboard/tracks/${trackId}`)}
              className={btnSoft}
            >
              Back to track
            </button>
            {canManage && (
              <>
                <Link
                  href={`/dashboard/tracks/${trackId}/builder`}
                  className={btnSoft}
                >
                  Builder
                </Link>
                <Link
                  href={`/dashboard/tracks/${trackId}/assign`}
                  className={btnSoft}
                >
                  Assign
                </Link>
              </>
            )}
          </div>
        </div>

        {!joinOk && (
          <div className={`${card} p-5 text-sm text-foreground/70`}>
            Heads up: there aren’t FK relationships set up for{" "}
            <span className="font-semibold">track_assignments → staff_members/facilities</span>, so
            Supabase can’t auto-join. We’re still showing clean names via a fallback lookup.
          </div>
        )}

        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className={`${card} p-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Assigned
            </p>
            <p className="mt-2 text-2xl font-semibold">{stats.assigned}</p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
              In progress
            </p>
            <p className="mt-2 text-2xl font-semibold">{stats.in_progress}</p>
          </div>
          <div className={`${card} p-4 border-rose-500/25 bg-rose-500/10`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200/80">
              Overdue
            </p>
            <p className="mt-2 text-2xl font-semibold text-rose-200">
              {stats.overdue}
            </p>
          </div>
          <div
            className={`${card} p-4 border-emerald-500/25 bg-emerald-500/10`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
              Completed
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">
              {stats.completed}
            </p>
          </div>
        </div>

        {/* Assignments table */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Assignments</h2>
              <p className="mt-1 text-sm text-foreground/60">
                {stats.total} total assignments for this track.
              </p>
            </div>
            <span className={pill}>Track → Staff</span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Facility</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Assigned</th>
                  <th className="px-5 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const overdue = isOverdue(r.due_date, r.status);

                  // ✅ joined (if available) OR fallback map OR raw id
                  const joinedStaff = r.staff_members;
                  const fallbackStaff = staffMap[r.staff_id];

                  const staffName =
                    joinedStaff?.full_name ||
                    fallbackStaff?.full_name ||
                    joinedStaff?.email ||
                    fallbackStaff?.email ||
                    r.staff_id;

                  const staffEmail =
                    joinedStaff?.email || fallbackStaff?.email || null;

                  const joinedFacility = r.facilities;
                  const fallbackFacility = facilityMap[r.facility_id];

                  const facilityName =
                    joinedFacility?.name ||
                    fallbackFacility?.name ||
                    r.facility_id;

                  const statusLabel =
                    r.status === "assigned"
                      ? "Assigned"
                      : r.status === "in_progress"
                      ? "In progress"
                      : r.status === "completed"
                      ? "Completed"
                      : r.status;

                  return (
                    <tr key={r.id} className="bg-card">
                      <td className="px-5 py-3">
                        <div className="min-w-[180px]">
                          <p className="font-semibold">{staffName}</p>
                          {staffEmail &&
                            (joinedStaff?.full_name || fallbackStaff?.full_name) && (
                              <p className="text-xs text-foreground/60">
                                {staffEmail}
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <span className="text-foreground/80">{facilityName}</span>
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
                            r.status === "completed"
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                              : overdue
                              ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
                              : "border-border bg-background text-foreground/80"
                          }`}
                        >
                          {overdue && r.status !== "completed"
                            ? "Overdue"
                            : statusLabel}
                        </span>
                      </td>

                      <td className="px-5 py-3">{fmtDate(r.due_date)}</td>
                      <td className="px-5 py-3">{fmtDate(r.created_at)}</td>
                      <td className="px-5 py-3">{fmtDate(r.completed_at)}</td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td
                      className="px-5 py-6 text-sm text-foreground/60"
                      colSpan={6}
                    >
                      No one is assigned to this track yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border px-5 py-4 text-[11px] text-foreground/50">
            Overdue is computed when due_date is in the past and the assignment
            isn’t completed.
          </div>
        </div>
      </div>
    </div>
  );
}
