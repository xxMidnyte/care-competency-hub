"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  facility_id: string;
  org_id: string;
  total_required_competencies: number;
  current_competencies: number;
  overall_compliance_pct: number;
  overdue_staff_count: number;
  overdue_items_count: number;
  expiring_in_30_days_count: number;
};

type HighRisk = {
  competency_id: string;
  competency_name: string;
  risk_level: "low" | "medium" | "high" | "critical";
  staff_overdue: number;
  overdue_items: number;
};

type ApiResponse = {
  facilityId: string;
  snapshot: Snapshot | null;
  highRiskCompetencies: HighRisk[];
};

type OverdueStaff = {
  staff_id: string | null;
  full_name: string;
  role_title: string | null;
  due_date: string | null;
  days_overdue: number | null;
};

interface Props {
  facilityId: string;
  facilityName?: string;
}

export function FacilitySnapshotCard({ facilityId, facilityName }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // drill-down state
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<OverdueStaff[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/dashboard/facility/${facilityId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dashboard");
        }

        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  async function handleToggleCompetency(c: HighRisk) {
    // clicking the same one again collapses it
    if (selectedCompetencyId === c.competency_id) {
      setSelectedCompetencyId(null);
      setStaffList([]);
      setStaffError(null);
      return;
    }

    setSelectedCompetencyId(c.competency_id);
    setStaffLoading(true);
    setStaffError(null);
    setStaffList([]);

    try {
      const res = await fetch(
        `/api/dashboard/facility/${facilityId}/competency/${c.competency_id}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load overdue staff");
      }

      const json = (await res.json()) as OverdueStaff[];
      setStaffList(json);
    } catch (err: any) {
      setStaffError(err.message || "Something went wrong loading staff");
    } finally {
      setStaffLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading snapshot…</p>
      </div>
    );
  }

  if (error || !data || !data.snapshot) {
    return (
      <div className="rounded-2xl border border-red-900/60 bg-red-950/50 p-6">
        <p className="text-sm font-medium text-red-300">
          Couldn&apos;t load facility snapshot.
        </p>
        {error && (
          <p className="mt-1 text-xs text-red-400/80 break-all">{error}</p>
        )}
      </div>
    );
  }

  const { snapshot, highRiskCompetencies } = data;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-50 shadow-lg shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">
            Facility snapshot
          </p>
          <p className="text-xs text-slate-400">
            {facilityName ?? "Primary facility"} • real-time compliance overview
          </p>
        </div>
      </div>

      {/* Top 3 metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Overall compliance */}
        <div className="col-span-1 rounded-2xl bg-emerald-600/90 px-5 py-4 text-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.15em]">
            Overall compliance
          </p>
          <p className="mt-2 text-4xl font-bold leading-none">
            {snapshot.overall_compliance_pct.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-950/80">
            of required competencies are current
          </p>
        </div>

        {/* Overdue staff */}
        <div className="rounded-2xl bg-slate-900/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-400">
            Overdue staff
          </p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">
            {snapshot.overdue_staff_count}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            flagged for follow-up
          </p>
        </div>

        {/* Expiring soon */}
        <div className="rounded-2xl bg-slate-900/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
            Expiring in 30 days
          </p>
          <p className="mt-2 text-3xl font-semibold text-amber-200">
            {snapshot.expiring_in_30_days_count}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            automatic reminders scheduled
          </p>
        </div>
      </div>

      {/* High-risk list */}
      <div className="mt-6 rounded-2xl bg-slate-950/40 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          High-risk competencies
        </p>

        {highRiskCompetencies.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No high-risk competencies overdue. 🎉
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {highRiskCompetencies.map((item) => {
              const isOpen = selectedCompetencyId === item.competency_id;

              return (
                <li
                  key={item.competency_id}
                  className="rounded-xl bg-slate-900/80 px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleCompetency(item)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="font-medium text-slate-50">
                        {item.competency_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.staff_overdue} staff overdue •{" "}
                        {item.overdue_items} items
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                        item.risk_level === "critical"
                          ? "bg-rose-500/90 text-rose-50"
                          : item.risk_level === "high"
                          ? "bg-orange-500/80 text-orange-50"
                          : item.risk_level === "medium"
                          ? "bg-amber-400/90 text-amber-950"
                          : "bg-emerald-400/90 text-emerald-950",
                      ].join(" ")}
                    >
                      {item.risk_level}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-2 border-t border-slate-800 pt-2 text-xs text-slate-300">
                      {staffLoading && <p>Loading overdue staff…</p>}

                      {staffError && (
                        <p className="text-rose-300">{staffError}</p>
                      )}

                      {!staffLoading && !staffError && staffList.length === 0 && (
                        <p>No individual staff records found for this item.</p>
                      )}

                      {!staffLoading && !staffError && staffList.length > 0 && (
                        <ul className="space-y-1">
                          {staffList.map((s) => (
                            <li
                              key={s.staff_id ?? s.full_name}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-slate-50">
                                  {s.full_name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {s.role_title ?? "Staff"}{" "}
                                  {s.due_date && (
                                    <>
                                      • due{" "}
                                      {new Date(
                                        s.due_date
                                      ).toLocaleDateString()}
                                    </>
                                  )}
                                </p>
                              </div>
                              {typeof s.days_overdue === "number" &&
                                s.days_overdue >= 0 && (
                                  <span className="text-[11px] text-rose-300">
                                    {s.days_overdue} days overdue
                                  </span>
                                )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
