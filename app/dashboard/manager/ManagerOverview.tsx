// app/dashboard/manager/ManagerOverview.tsx
"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  facility_id: string;
  total_assigned: number;
  total_completed: number;
  overdue_count: number;
  completion_rate: number;
};

type HighRiskRow = {
  competency_id: string;
  competency_name: string;
  risk_level: string | null;
  staff_overdue: number;
  overdue_items: number;
};

type OverviewPayload = {
  facilityId: string;
  snapshot: Snapshot | null;
  highRiskCompetencies: HighRiskRow[];
};

export function ManagerOverview({ facilityId }: { facilityId: string }) {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/manager/facility/${facilityId}/overview`
        );
        const json = await res.json();

        if (!res.ok) {
          console.error("Manager overview error:", json);
          setError("Unable to load manager overview.");
          return;
        }

        setData(json);
      } catch (err) {
        console.error("Manager overview fetch failed:", err);
        setError("Unable to load manager overview.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [facilityId]);

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Loading manager overview…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-200">
        {error ?? "No manager overview data available."}
      </div>
    );
  }

  const snapshot = data.snapshot;

  return (
    <div className="space-y-6">
      {/* Snapshot cards */}
      {snapshot && (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Overall completion */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Completion rate
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {snapshot.completion_rate ?? 0}%
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, snapshot.completion_rate ?? 0)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Total assigned */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total assigned
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {snapshot.total_assigned ?? 0}
            </p>
          </div>

          {/* Overdue */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Overdue
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {snapshot.overdue_count ?? 0}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                snapshot.overdue_count > 0
                  ? "bg-red-500/15 text-red-300 border border-red-500/40"
                  : "bg-slate-800 text-slate-300 border border-slate-700/60"
              }`}
            >
              {snapshot.overdue_count > 0
                ? "Action needed"
                : "No overdue assignments"}
            </span>
          </div>
        </div>
      )}

      {/* High-risk list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            High-risk / problem areas
          </h2>
          <p className="text-xs text-slate-400">
            Top {data.highRiskCompetencies.length || 0} competencies
            by risk & overdue staff
          </p>
        </div>

        {data.highRiskCompetencies.length === 0 ? (
          <p className="text-xs text-slate-400">
            No high-risk competencies flagged yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2">Competency</th>
                  <th className="px-4 py-2">Risk</th>
                  <th className="px-4 py-2">Staff overdue</th>
                  <th className="px-4 py-2">Overdue items</th>
                </tr>
              </thead>
              <tbody>
                {data.highRiskCompetencies.map((row) => (
                  <tr
                    key={row.competency_id}
                    className="border-t border-slate-900/60"
                  >
                    <td className="px-4 py-2 text-slate-100">
                      {row.competency_name}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                        {row.risk_level ?? "Unspecified"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-100">
                      {row.staff_overdue}
                    </td>
                    <td className="px-4 py-2 text-slate-100">
                      {row.overdue_items}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
