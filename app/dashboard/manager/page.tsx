// app/dashboard/manager/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Facility = {
  id: string;
  name: string | null;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Competency = {
  id: string;
  title: string | null;
  risk: string | null;
  roles: string[] | null;
  setting: string | null;
};

type Assignment = {
  id: string;
  competency_id: string;
  status: "assigned" | "completed";
  due_date: string | null;
  completed_at: string | null;
};

type CompetencyRow = {
  competency: Competency;
  assignment: Assignment | null;
};

// From /api/manager/facility/[facilityId]/overview
type FacilitySnapshot = {
  facility_id: string;
  total_assigned: number;
  total_completed: number;
  overdue_count: number;
  completion_rate: number;
};

type StaffSummaryRow = {
  staff_id: string;
  full_name: string | null;
  role_title: string | null;
  facility_id: string;
  overdue_count: number;
  next_overdue_due_at: string | null;
};

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { loading: orgLoading, org, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | "">("");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | "">("");

  const [competencyRows, setCompetencyRows] = useState<CompetencyRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);

  // Manager overview (snapshot + staff summary)
  const [snapshot, setSnapshot] = useState<FacilitySnapshot | null>(null);
  const [staffSummary, setStaffSummary] = useState<StaffSummaryRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Helper to show transient messages
  function flashMessage(
    type: "error" | "success",
    message: string,
    timeout = 3000
  ) {
    if (type === "error") {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, timeout);
  }

  // 1) Auth check (redirect if no user)
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      }
    }

    checkAuth();
  }, [router]);

  // 2) Load facilities once org context is ready
  useEffect(() => {
    if (orgLoading) return;

    if (!organizationId) {
      setError("Organization context is missing. Please contact support.");
      setLoading(false);
      return;
    }

    async function loadFacilities() {
      setLoading(true);

      const { data: facs, error: facError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", organizationId)
        .order("name", { ascending: true });

      if (facError) {
        console.error("Facilities load error:", facError);
        setError("Unable to load facilities.");
        setLoading(false);
        return;
      }

      setFacilities(facs || []);
      setLoading(false);
    }

    loadFacilities();
  }, [orgLoading, organizationId]);

  // 3) Load manager overview (snapshot + staff summary) when facility changes
  useEffect(() => {
    if (!selectedFacilityId) {
      setSnapshot(null);
      setStaffSummary([]);
      return;
    }

    async function loadOverview() {
      try {
        setOverviewLoading(true);
        setOverviewError(null);

        const res = await fetch(
          `/api/manager/facility/${selectedFacilityId}/overview`
        );
        const json = await res.json();

        if (!res.ok) {
          console.error("Manager overview error:", json);
          setOverviewError("Unable to load facility overview.");
          setSnapshot(null);
          setStaffSummary([]);
          return;
        }

        setSnapshot(json.snapshot || null);
        setStaffSummary(json.staff || []);
      } catch (err) {
        console.error("Manager overview fetch failed:", err);
        setOverviewError("Unable to load facility overview.");
        setSnapshot(null);
        setStaffSummary([]);
      } finally {
        setOverviewLoading(false);
      }
    }

    loadOverview();
  }, [selectedFacilityId]);

  // 4) Load staff when facility changes (for assignment dropdown)
  useEffect(() => {
    if (!organizationId || !selectedFacilityId) return;

    async function loadStaff() {
      setStaff([]);
      setSelectedStaffId("");
      setCompetencyRows([]);

      const { data, error } = await supabase
        .from("staff_members")
        .select("id, full_name, email")
        .eq("org_id", organizationId)
        .eq("facility_id", selectedFacilityId)
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Staff load error:", error);
        flashMessage("error", "Unable to load staff.");
        return;
      }

      setStaff(data || []);
    }

    loadStaff();
  }, [organizationId, selectedFacilityId]);

  // 5) Load competencies + assignments when staff selected
  useEffect(() => {
    if (!organizationId || !selectedFacilityId || !selectedStaffId) return;

    async function loadRows() {
      setRowsLoading(true);

      // competency_templates scoped by org
      const { data: comps, error: compError } = await supabase
        .from("competency_templates")
        .select("id, title, risk, roles, setting")
        .eq("org_id", organizationId)
        .order("created_at", { ascending: false });

      if (compError) {
        console.error("Competency templates load error:", compError);
        flashMessage("error", "Unable to load competencies.");
        setRowsLoading(false);
        return;
      }

      // Existing assignments for this staff+facility
      const { data: assigns, error: assignError } = await supabase
        .from("competency_assignments")
        .select("id, competency_id, status, due_date, completed_at")
        .eq("org_id", organizationId)
        .eq("facility_id", selectedFacilityId)
        .eq("staff_id", selectedStaffId);

      if (assignError) {
        console.error("Assignments load error:", assignError);
        flashMessage("error", "Unable to load assignments.");
        setRowsLoading(false);
        return;
      }

      const assignmentsByComp = new Map<string, Assignment>();
      (assigns || []).forEach((a: any) => {
        assignmentsByComp.set(a.competency_id, a as Assignment);
      });

      const rows: CompetencyRow[] = (comps || []).map((c: any) => ({
        competency: c as Competency,
        assignment: assignmentsByComp.get(c.id) || null,
      }));

      setCompetencyRows(rows);
      setRowsLoading(false);
    }

    loadRows();
  }, [organizationId, selectedFacilityId, selectedStaffId]);

  // Actions
  async function handleAssign(competencyId: string) {
    if (!organizationId || !selectedFacilityId || !selectedStaffId) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("competency_assignments")
      .insert({
        org_id: organizationId,
        facility_id: selectedFacilityId,
        staff_id: selectedStaffId,
        competency_id: competencyId,
        status: "assigned",
        due_date: null,
        completed_at: null,
      })
      .select("id, competency_id, status, due_date, completed_at")
      .single();

    if (error) {
      console.error("Assign error:", error);
      flashMessage("error", "Error assigning competency.");
      setSaving(false);
      return;
    }

    setCompetencyRows((prev) =>
      prev.map((row) =>
        row.competency.id === competencyId
          ? { ...row, assignment: data as Assignment }
          : row
      )
    );

    flashMessage("success", "Competency assigned.");
    setSaving(false);
  }

  async function handleUpdateDueDate(
    competencyId: string,
    assignmentId: string | null,
    newDueDate: string
  ) {
    if (!assignmentId) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("competency_assignments")
      .update({ due_date: newDueDate })
      .eq("id", assignmentId)
      .select("id, competency_id, status, due_date, completed_at")
      .single();

    if (error) {
      console.error("Update due date error:", error);
      flashMessage("error", "Error updating due date.");
      setSaving(false);
      return;
    }

    setCompetencyRows((prev) =>
      prev.map((row) =>
        row.competency.id === competencyId
          ? { ...row, assignment: data as Assignment }
          : row
      )
    );

    flashMessage("success", "Due date updated.");
    setSaving(false);
  }

  async function handleMarkComplete(
    competencyId: string,
    assignmentId: string | null
  ) {
    if (!assignmentId) return;

    setSaving(true);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("competency_assignments")
      .update({ status: "completed", completed_at: now })
      .eq("id", assignmentId)
      .select("id, competency_id, status, due_date, completed_at")
      .single();

    if (error) {
      console.error("Mark complete error:", error);
      flashMessage("error", "Error marking complete.");
      setSaving(false);
      return;
    }

    setCompetencyRows((prev) =>
      prev.map((row) =>
        row.competency.id === competencyId
          ? { ...row, assignment: data as Assignment }
          : row
      )
    );

    flashMessage("success", "Marked as completed.");
    setSaving(false);
  }

  // Risk badge
  function riskBadge(risk: string | null) {
    if (!risk) return null;
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
    const color =
      risk === "Critical"
        ? "bg-red-500/10 text-red-400 border border-red-500/40"
        : risk === "High"
        ? "bg-orange-500/10 text-orange-400 border border-orange-500/40"
        : risk === "Medium"
        ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40"
        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
    return <span className={`${base} ${color}`}>{risk}</span>;
  }

  // Hard role gate: managers/admins only
  const role = org?.role;
  const isManagerOrAdmin = role === "admin" || role === "manager";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Manager dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Get a quick overview of compliance by facility, then assign and
            track competencies by staff member.
          </p>
        </div>

        {/* Global loading */}
        {orgLoading || loading ? (
          <div className="px-6 py-8 text-sm text-slate-400">Loading…</div>
        ) : !organizationId ? (
          // Hard org error
          <div className="rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-6 text-sm text-red-100">
            Organization context could not be loaded. Please refresh the page
            or contact support if this continues.
          </div>
        ) : !isManagerOrAdmin ? (
          // Role-based access gate
          <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] px-4 py-6 text-sm text-slate-300">
            You don&apos;t have permission to access the manager dashboard.
            Please contact your administrator if you think this is a mistake.
          </div>
        ) : (
          <>
            {/* Flash messages */}
            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-200">
                {success}
              </div>
            )}

            {/* Facility selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Facility
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select a facility…</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Manager overview: snapshot + staff list */}
            <div className="space-y-4">
              {selectedFacilityId ? (
                overviewLoading ? (
                  <div className="text-sm text-slate-400">
                    Loading facility overview…
                  </div>
                ) : overviewError ? (
                  <div className="rounded-md border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">
                    {overviewError}
                  </div>
                ) : (
                  <>
                    {/* Snapshot cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Completion rate
                        </p>
                        <p className="mt-2 text-3xl font-semibold">
                          {snapshot?.completion_rate ?? 0}%
                        </p>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  snapshot?.completion_rate ?? 0
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Total assigned
                        </p>
                        <p className="mt-2 text-3xl font-semibold">
                          {snapshot?.total_assigned ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Overdue
                        </p>
                        <p className="mt-2 text-3xl font-semibold">
                          {snapshot?.overdue_count ?? 0}
                        </p>
                        <span
                          className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            (snapshot?.overdue_count ?? 0) > 0
                              ? "bg-red-500/15 text-red-300 border border-red-500/40"
                              : "bg-slate-800 text-slate-300 border border-slate-700/60"
                          }`}
                        >
                          {(snapshot?.overdue_count ?? 0) > 0
                            ? "Action needed"
                            : "No overdue assignments"}
                        </span>
                      </div>
                    </div>

                    {/* Staff overview table */}
                    <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-[var(--surface)] px-4 py-3">
                        <div>
                          <h2 className="text-sm font-medium">
                            Staff overview
                          </h2>
                          <p className="text-xs text-slate-400">
                            Overdue counts and next upcoming due dates for this
                            facility.
                          </p>
                        </div>
                      </div>

                      {staffSummary.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-slate-400">
                          No staff compliance data yet for this facility.
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-auto">
                          <table className="min-w-full text-sm">
                            <thead className="sticky top-0 border-b border-slate-900/60 bg-[var(--surface)] text-xs uppercase tracking-wide text-slate-400">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium">
                                  Staff
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Role
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Overdue
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Next due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {staffSummary.map((row) => (
                                <tr
                                  key={row.staff_id}
                                  className="border-b border-slate-900/60"
                                >
                                  <td className="px-4 py-2 align-top text-slate-100">
                                    {row.full_name || "Unnamed staff"}
                                  </td>
                                  <td className="px-4 py-2 align-top text-xs text-slate-400">
                                    {row.role_title || "—"}
                                  </td>
                                  <td className="px-4 py-2 align-top text-slate-100">
                                    {row.overdue_count}
                                  </td>
                                  <td className="px-4 py-2 align-top text-xs text-slate-300">
                                    {row.next_overdue_due_at
                                      ? row.next_overdue_due_at.slice(0, 10)
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )
              ) : (
                <div className="text-sm text-slate-400">
                  Select a facility to view overview and staff compliance.
                </div>
              )}
            </div>

            {/* Staff selector + Competency table */}
            <div className="grid gap-4 md:grid-cols-2 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Staff member
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  disabled={!selectedFacilityId || staff.length === 0}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {!selectedFacilityId ? (
                    <option value="">Select a facility first…</option>
                  ) : staff.length === 0 ? (
                    <option value="">No staff in this facility yet.</option>
                  ) : (
                    <>
                      <option value="">Select a staff member…</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name || s.email}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              {/* Spacer/placeholder for future filters */}
              <div />
            </div>

            {/* Competency table */}
            <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[var(--surface)] px-4 py-3">
                <div>
                  <h2 className="text-sm font-medium">Competencies</h2>
                  <p className="text-xs text-slate-400">
                    Assign, track due dates, and mark completion.
                  </p>
                </div>
                {saving && (
                  <span className="text-xs text-emerald-300/80">
                    Saving changes…
                  </span>
                )}
              </div>

              {!selectedFacilityId || !selectedStaffId ? (
                <div className="px-4 py-6 text-sm text-slate-400">
                  Select a facility and staff member to view competencies.
                </div>
              ) : rowsLoading ? (
                <div className="px-4 py-6 text-sm text-slate-400">
                  Loading competencies…
                </div>
              ) : competencyRows.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400">
                  No competencies found for this organization yet.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--surface)] backdrop-blur">
                      <tr className="border-b border-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-2 text-left font-medium">
                          Title
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Risk
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Due date
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencyRows.map((row) => {
                        const { competency, assignment } = row;
                        const isAssigned = !!assignment;
                        const isCompleted = assignment?.status === "completed";
                        const roles = competency.roles || [];

                        return (
                          <tr
                            key={competency.id}
                            className="border-b border-slate-900/60"
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {competency.title}
                                </span>
                                {roles.length > 0 && (
                                  <span className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                                    {roles.length === 1
                                      ? roles[0]
                                      : `${roles[0]} +${
                                          roles.length - 1
                                        } more`}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              {riskBadge(competency.risk)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {isAssigned ? (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    isCompleted
                                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                                      : "bg-sky-500/10 text-sky-300 border border-sky-500/40"
                                  }`}
                                >
                                  {isCompleted ? "Completed" : "Assigned"}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  Not assigned
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {isAssigned && !isCompleted ? (
                                <input
                                  type="date"
                                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                  value={
                                    assignment?.due_date
                                      ? assignment.due_date.slice(0, 10)
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleUpdateDueDate(
                                      competency.id,
                                      assignment?.id ?? null,
                                      e.target.value
                                    )
                                  }
                                />
                              ) : isCompleted && assignment?.completed_at ? (
                                <span className="text-xs text-slate-400">
                                  Done {assignment.completed_at.slice(0, 10)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top text-right">
                              {!isAssigned ? (
                                <button
                                  onClick={() =>
                                    handleAssign(competency.id)
                                  }
                                  className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-950"
                                >
                                  Assign
                                </button>
                              ) : !isCompleted ? (
                                <button
                                  onClick={() =>
                                    handleMarkComplete(
                                      competency.id,
                                      assignment?.id ?? null
                                    )
                                  }
                                  className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-950"
                                >
                                  Mark complete
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
