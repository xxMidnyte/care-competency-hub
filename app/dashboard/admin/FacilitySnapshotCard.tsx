"use client";

type FacilitySnapshotCardProps = {
  name: string | null;
  staffCount?: number | null;
  readiness?: number | null; // percent 0–100
};

export function FacilitySnapshotCard({
  name,
  staffCount,
  readiness,
}: FacilitySnapshotCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-50">
            {name || "Facility name"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {typeof staffCount === "number"
              ? `${staffCount} tracked staff`
              : "Staff tracking coming soon"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] text-slate-400">Readiness</p>
          <p className="text-lg font-semibold text-emerald-300">
            {typeof readiness === "number" ? `${readiness}%` : "—"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Facility-level dashboard and assignments coming soon. This card will
        show due items, high-risk skills, and track status at a glance.
      </p>
    </div>
  );
}
