// app/dashboard/facility/[facilityId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type FacilityStats = {
  facility_id: string;
  total_assigned: number;
  total_completed: number;
  overdue_count: number;
  percentage_complete: number;
};

export default function FacilityDashboardPage() {
  const params = useParams();
  const facilityId = params?.facilityId as string;

  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/dashboard/facility/${facilityId}/stats`);
        const json = await res.json();

        if (!res.ok) {
          console.error("Facility stats error:", json);
          setError("Unable to load facility stats.");
          return;
        }

        setStats(json);
      } catch (err) {
        console.error("Facility stats fetch failed:", err);
        setError("Unable to load facility stats.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [facilityId]);

  if (loading) {
    return <div className="text-sm text-slate-400">Loading facility dashboard…</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-sm text-slate-400">
        No assignment data found for this facility yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Facility dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Quick snapshot of assignment progress for this facility.
        </p>
      </div>

      {/* Snapshot cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total assigned */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total assigned
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {stats.total_assigned ?? 0}
          </p>
        </div>

        {/* % complete */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            % complete
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {stats.percentage_complete ?? 0}%
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, stats.percentage_complete ?? 0)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Overdue flag */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Overdue
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {stats.overdue_count ?? 0}
          </p>
          <span
            className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              stats.overdue_count > 0
                ? "bg-red-500/15 text-red-300 border border-red-500/40"
                : "bg-slate-800 text-slate-300 border border-slate-700/60"
            }`}
          >
            {stats.overdue_count > 0
              ? "Action needed"
              : "No overdue assignments"}
          </span>
        </div>
      </div>

      {/* You can add tables / detail views under here later */}
    </div>
  );
}
