"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Icon } from "@/components/ui/Icon";

type StaffRow = {
  staff_id: string;
  full_name: string;
  role_title: string | null;
  overdue_count: number;
  next_overdue_due_at: string | null;
};

type Snapshot = {
  overall_compliance_pct: number;
  overdue_staff_count: number;
  expiring_in_30_days: number;
};

export default function ManagerDashboardPage() {
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) figure out manager's facility
  useEffect(() => {
    async function loadFacility() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in.");
        setLoading(false);
        return;
      }

      const { data: staffRow, error: staffErr } = await supabase
        .from("staff_members")
        .select("facility_id")
        .eq("auth_user_id", user.id)
        .eq("is_manager", true)
        .maybeSingle();

      if (staffErr) {
        console.error("staff_members error", staffErr);
      }

      if (!staffRow?.facility_id) {
        setError("No facility assigned to this manager.");
        setLoading(false);
        return;
      }

      setFacilityId(staffRow.facility_id);
    }

    loadFacility();
  }, []);

  // 2) fetch dashboard data for that facility
  useEffect(() => {
    if (!facilityId) return;

    async function load() {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/manager/facility/${facilityId}/overview`);
      if (!res.ok) {
        console.error("overview error", await res.text());
        setError("Failed to load manager dashboard");
        setLoading(false);
        return;
      }

      const json = await res.json();
      setSnapshot(json.snapshot);
      setStaff(json.staff ?? []);
      setLoading(false);
    }

    load();
  }, [facilityId]);

  return (
    <DashboardShell title="Manager Overview">
      {loading && (
        <p className="p-6 text-sm text-slate-400">
          Loading manager dashboard…
        </p>
      )}

      {!loading && error && (
        <p className="p-6 text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && snapshot && (
        <div className="space-y-6">
          {/* top cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              label="Overall compliance"
              value={`${snapshot.overall_compliance_pct.toFixed(1)}%`}
            />
            <Card
              label="Overdue staff"
              value={snapshot.overdue_staff_count}
            />
            <Card
              label="Expiring in 30 days"
              value={snapshot.expiring_in_30_days}
            />
          </div>

          {/* staff table + print button */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Staff at this facility
              </h2>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                <Icon name="download" variant="solid" size={16} />
                <span>Print summary</span>
              </button>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Staff</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-right">Overdue</th>
                  <th className="px-4 py-2 text-right">Next due</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr
                    key={row.staff_id}
                    className="border-t border-slate-800"
                  >
                    <td className="px-4 py-2 text-slate-100">
                      {row.full_name}
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {row.role_title ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-100">
                      {row.overdue_count > 0 ? (
                        <span className="rounded-full bg-rose-600/20 px-2 py-0.5 text-rose-300">
                          {row.overdue_count}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-400">
                      {row.next_overdue_due_at
                        ? new Date(
                            row.next_overdue_due_at
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TODO: assignment UI here */}
        </div>
      )}
    </DashboardShell>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
