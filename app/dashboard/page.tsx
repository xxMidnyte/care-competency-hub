// src/app/dashboard/manager/page.tsx
"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Icon } from "@/components/ui/Icon";

export default function ManagerDashboardPage() {
  return (
    <DashboardShell title="Manager Overview">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Left column: facility snapshot */}
        <section className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Current Facility Snapshot
            </h2>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700">
              <Icon name="analytics" variant="line" size={16} />
              <span>View full report</span>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <CardStat
              label="Competencies overdue"
              value="18"
              tone="danger"
            />
            <CardStat
              label="Due this month"
              value="42"
              tone="warn"
            />
            <CardStat
              label="On track"
              value="86%"
              tone="ok"
            />
          </div>
        </section>

        {/* Right column: quick actions */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">
            Quick actions
          </h2>

          <div className="space-y-2 text-xs">
            <button className="flex w-full items-center justify-between rounded-xl bg-emerald-500 px-3 py-2 text-slate-950 hover:bg-emerald-400">
              <span className="flex items-center gap-2">
                <Icon name="plus" variant="solid" size={18} />
                Create competency
              </span>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-3 py-2 text-slate-100 hover:bg-slate-700">
              <span className="flex items-center gap-2">
                <Icon name="ai-bolt" variant="solid" size={18} />
                AI Builder
              </span>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-slate-200 hover:bg-slate-800">
              <span className="flex items-center gap-2">
                <Icon name="assignments" variant="line" size={18} />
                Assign competencies
              </span>
            </button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

type Tone = "ok" | "warn" | "danger";

function CardStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
