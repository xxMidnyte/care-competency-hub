// app/my-competencies/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type StaffSelf = {
  id: string;
  full_name: string | null;
  email: string | null;
  org_id: string;
  facility_id: string | null;
};

type Assignment = {
  id: string;
  competency_id: string;
  status: "assigned" | "completed" | string;
  due_date: string | null;
  completed_at: string | null;
};

type Competency = {
  id: string;
  title: string | null;
  risk: string | null;
  roles: string[] | null;
  setting: string | null;
};

type AssignmentRow = {
  assignment: Assignment;
  competency: Competency | null;
};

export default function MyCompetenciesPage() {
  const router = useRouter();
  const { loading: orgLoading, org, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffSelf | null>(null);
  const [rows, setRows] = useState<AssignmentRow[]>([]);

  const userRole =
    (org?.role as "admin" | "manager" | "staff" | string | null) ?? "staff";

  // Helper: flash message
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

  // 1) Auth + load staff record (by org + email)
  useEffect(() => {
    async function init() {
      if (orgLoading) return;

      setLoading(true);

      if (!organizationId || !org) {
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.error("Auth error:", userErr);
        router.push("/login");
        return;
      }

      const email = user.email;
      if (!email) {
        setError(
          "Your account does not have an email address. Please contact support."
        );
        setLoading(false);
        return;
      }

      const { data: staffRow, error: staffErr } = await supabase
        .from("staff_members")
        .select("id, full_name, email, org_id, facility_id")
        .eq("org_id", organizationId)
        .eq("email", email)
        .maybeSingle();

      if (staffErr) {
        console.error("Staff lookup error:", staffErr);
        setError("Unable to load your staff profile.");
        setLoading(false);
        return;
      }

      if (!staffRow) {
        setError(
          "We couldn't find a staff profile linked to your account. Please contact your manager."
        );
        setLoading(false);
        return;
      }

      setStaff(staffRow as StaffSelf);
      setLoading(false);
    }

    init();
  }, [orgLoading, org, organizationId, router]);

  // 2) Load assignments + competencies when staff is ready
  useEffect(() => {
    if (!staff) return;

    async function loadAssignments(currentStaff: StaffSelf) {
      setLoading(true);
      setRows([]);

      const { data: assignments, error: assignErr } = await supabase
        .from("competency_assignments")
        .select("id, competency_id, status, due_date, completed_at")
        .eq("staff_id", currentStaff.id)
        .eq("org_id", currentStaff.org_id)
        .order("due_date", { ascending: true });

      if (assignErr) {
        console.error("Assignments load error:", assignErr);
        setError("Unable to load your competencies.");
        setLoading(false);
        return;
      }

      if (!assignments || assignments.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const competencyIds = Array.from(
        new Set(assignments.map((a: any) => a.competency_id))
      );

      const { data: competencies, error: compErr } = await supabase
        .from("competency_templates")
        .select("id, title, risk, roles, setting")
        .in("id", competencyIds);

      if (compErr) {
        console.error("Competencies load error:", compErr);
        setError("Unable to load competency details.");
        setLoading(false);
        return;
      }

      const compById = new Map<string, Competency>();
      (competencies || []).forEach((c: any) => {
        compById.set(c.id, c as Competency);
      });

      const merged: AssignmentRow[] = (assignments || []).map((a: any) => ({
        assignment: a as Assignment,
        competency: compById.get(a.competency_id) || null,
      }));

      setRows(merged);
      setLoading(false);
    }

    // pass staff as arg so TS knows it's non-null in loader
    loadAssignments(staff);
  }, [staff]);

  // 3) Derived progress metrics (includes dueSoon)
  const progress = useMemo(() => {
    if (!rows.length) {
      return {
        total: 0,
        completed: 0,
        overdue: 0,
        dueSoon: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = rows.length;
    let completed = 0;
    let overdue = 0;
    let dueSoon = 0;

    for (const row of rows) {
      const a = row.assignment;
      if (a.status === "completed") {
        completed += 1;
        continue;
      }

      if (a.due_date) {
        const due = new Date(a.due_date);
        due.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (due < today) overdue += 1;
        else if (diffDays >= 0 && diffDays <= 7) dueSoon += 1;
      }
    }

    return { total, completed, overdue, dueSoon };
  }, [rows]);

  const assignedActive = progress.total - progress.completed;

  // 4) Mark as complete
  async function handleMarkComplete(assignmentId: string) {
    if (!assignmentId) return;

    setSaving(true);

    const now = new Date().toISOString();

    const { data, error: updateErr } = await supabase
      .from("competency_assignments")
      .update({ status: "completed", completed_at: now })
      .eq("id", assignmentId)
      .select("id, competency_id, status, due_date, completed_at")
      .single();

    if (updateErr) {
      console.error("Mark complete error:", updateErr);
      flashMessage("error", "Something went wrong marking this complete.");
      setSaving(false);
      return;
    }

    setRows((prev) =>
      prev.map((row) =>
        row.assignment.id === assignmentId
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

  // Status badge
  function statusBadge(a: Assignment) {
    const isCompleted = a.status === "completed";
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
    const color = isCompleted
      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
      : "bg-sky-500/10 text-sky-300 border border-sky-500/40";

    return (
      <span className={`${base} ${color}`}>
        {isCompleted ? "Completed" : "Assigned"}
      </span>
    );
  }

  // ----- RENDER -----

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-6 py-8 text-sm text-slate-400">
          Loading your competencies…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My competencies
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              See what&apos;s assigned to you, track due dates, and mark
              competencies as completed.
            </p>
          </div>

          {staff && (
            <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] px-3 py-2 text-right text-[11px] text-slate-400">
              <div className="font-medium text-[var(--foreground)]">
                {staff.full_name || staff.email || "Staff member"}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {userRole || "staff"}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
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

        {/* Summary cards */}
        {!error && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Assigned"
              value={assignedActive}
              sub="Currently on your plate"
            />
            <SummaryCard
              label="Completed"
              value={progress.completed}
              sub="Marked as finished"
            />
            <SummaryCard
              label="Overdue"
              value={progress.overdue}
              sub="Past due date"
              tone="danger"
            />
            <SummaryCard
              label="Due soon"
              value={progress.dueSoon}
              sub="Within the next 7 days"
              tone="warn"
            />
          </div>
        )}

        {/* Assignments table */}
        <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[var(--surface)] px-4 py-3">
            <div>
              <h2 className="text-sm font-medium">Assigned competencies</h2>
              <p className="text-xs text-slate-400">
                Mark items as completed once you&apos;ve finished the required
                training or skills validation.
              </p>
            </div>
            {saving && (
              <span className="text-xs text-emerald-300/80">Saving…</span>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-400">
              You don&apos;t have any competencies assigned yet.
            </div>
          ) : (
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[var(--surface)] backdrop-blur">
                  <tr className="border-b border-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 text-left font-medium">Title</th>
                    <th className="px-4 py-2 text-left font-medium">Risk</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Due date
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const { assignment, competency } = row;
                    const isCompleted = assignment.status === "completed";
                    const due =
                      assignment.due_date &&
                      assignment.due_date.slice(0, 10);

                    return (
                      <tr
                        key={assignment.id}
                        className="border-b border-slate-900/60"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {competency?.title ?? "Untitled competency"}
                            </span>
                            {competency?.roles &&
                              competency.roles.length > 0 && (
                                <span className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                                  {competency.roles.join(", ")}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {riskBadge(competency?.risk ?? null)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {statusBadge(assignment)}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-slate-300">
                          {due || "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          {isCompleted ? (
                            <span className="text-xs text-slate-500">
                              Completed{" "}
                              {assignment.completed_at
                                ? assignment.completed_at.slice(0, 10)
                                : ""}
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleMarkComplete(assignment.id)
                              }
                              className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-950"
                            >
                              Mark complete
                            </button>
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
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  sub?: string;
  tone?: "default" | "warn" | "danger";
};

function SummaryCard({
  label,
  value,
  sub,
  tone = "default",
}: SummaryCardProps) {
  const base =
    "rounded-xl border px-4 py-3 flex flex-col gap-1 bg-[var(--surface-soft)]";
  const toneClasses =
    tone === "danger"
      ? "border-rose-500/60 bg-rose-500/10"
      : tone === "warn"
      ? "border-amber-500/60 bg-amber-500/10"
      : "border-slate-800";

  return (
    <div className={`${base} ${toneClasses}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}
