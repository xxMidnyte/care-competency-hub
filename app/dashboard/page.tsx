// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [roleLabel, setRoleLabel] = useState("Manager");

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const meta = (user.user_metadata || {}) as any;
      const role =
        meta.role ||
        meta.user_role ||
        "Manager";

      setRoleLabel(role);
    }

    loadRole();
  }, []);

  const isAdmin = roleLabel.toLowerCase() === "admin";

  const subtitle = isAdmin
    ? "High-level view of your organization, facilities, and competency workload."
    : "High-level view of your facilities and competency workload.";

  return (
    <div className="p-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            {roleLabel} Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:border-emerald-500/60">
            View notifications
          </button>
          <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:border-emerald-500/60">
            Manage team
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[2.1fr,1.3fr]">
        {/* LEFT: Snapshot */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Current Facility Snapshot
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                Overview for your currently selected facility.
              </p>
            </div>
            <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:border-emerald-500/60">
              View full report
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {/* Overdue */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium text-slate-300">
                Competencies overdue
              </p>
              <p className="mt-3 text-2xl font-semibold text-red-400">18</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Staff are past due on these items.
              </p>
            </div>

            {/* Due this month */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium text-slate-300">
                Due this month
              </p>
              <p className="mt-3 text-2xl font-semibold text-amber-300">42</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Items coming due in the next 30 days.
              </p>
            </div>

            {/* On track */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium text-slate-300">
                On track
              </p>
              <p className="mt-3 text-2xl font-semibold text-emerald-400">
                86%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Staff who are fully up to date.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT: Quick actions */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Quick actions
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <button className="flex w-full items-center justify-between rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-400">
              <span>Create competency</span>
              <span className="text-xs">↗</span>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 hover:border-emerald-500/60">
              <span>AI Builder</span>
              <span className="text-xs text-slate-400">Draft with AI</span>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 hover:border-emerald-500/60">
              <span>Assign competencies</span>
              <span className="text-xs text-slate-400">Staff &amp; roles</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
