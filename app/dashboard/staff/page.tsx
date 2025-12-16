// app/dashboard/staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ProgressShield from "@/components/ProgressShield";
import { useOrg } from "@/hooks/useOrg";
import { hasRoleAtLeast } from "@/lib/permissions";

type StaffProgressRow = {
  staff_id: string;
  org_id: string;
  full_name: string | null;
  email: string | null;
  total_assigned: number;
  total_completed: number;
  completion_ratio: number;
};

type AssignmentRow = {
  id: string;
  competency_title: string | null;
  status: string;
  due_date: string | null;
  assigned_at: string;
};

type StaffMemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

// ---- UI tokens / helpers ----
const card = "rounded-2xl border border-border bg-card shadow-card";
const label =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnSmallPrimary =
  "inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-card transition hover:opacity-90";
const btnIconDanger =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground/60 transition hover:border-red-500/50 hover:text-red-300 disabled:opacity-50";

export default function StaffDashboardPage() {
  const router = useRouter();
  const { loading: orgLoading, org, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StaffProgressRow | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMemberRow[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showManageStaff = hasRoleAtLeast(org, "manager");

  async function loadStaffMembers(orgIdValue: string) {
    setStaffLoading(true);
    setStaffError(null);

    const { data, error } = await supabase
      .from("staff_members")
      .select("id, full_name, email")
      .eq("org_id", orgIdValue)
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);
      setStaffError("Unable to load staff list.");
      setStaffMembers([]);
    } else {
      setStaffMembers((data || []) as StaffMemberRow[]);
    }

    setStaffLoading(false);
  }

  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Auth error:", userError);
        setError("You must be logged in to view your dashboard.");
        setLoading(false);
        return;
      }

      const userEmail = user.email;
      if (!userEmail) {
        setError("Your account does not have an email address.");
        setLoading(false);
        return;
      }

      const orgIdValue = organizationId;
      if (!orgIdValue) {
        console.error("No organizationId in context");
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      const { data: progressRows, error: progressError } = await supabase
        .from("staff_competency_progress")
        .select("*")
        .eq("org_id", orgIdValue)
        .eq("email", userEmail)
        .limit(1);

      if (progressError) {
        console.error("Error loading progress:", progressError);
        setError("Unable to load your competency progress.");
        setLoading(false);
        return;
      }

      const row = (progressRows && progressRows[0]) || null;
      setProgress(row as StaffProgressRow | null);

      if (row?.staff_id) {
        const { data: assignRows, error: assignError } = await supabase
          .from("staff_competency_assignments")
          .select("id, competency_title, status, due_date, assigned_at")
          .eq("staff_id", row.staff_id)
          .order("due_date", { ascending: true });

        if (assignError) {
          console.error("Error loading assignments:", assignError);
          setError("Unable to load your assignments.");
          setLoading(false);
          return;
        }

        setAssignments((assignRows || []) as AssignmentRow[]);
      } else {
        setAssignments([]);
      }

      if (showManageStaff) {
        await loadStaffMembers(orgIdValue);
      }

      setLoading(false);
    }

    load();
  }, [orgLoading, organizationId, showManageStaff]);

  const completionRatio = progress?.completion_ratio ?? 0;
  const totalAssigned = progress?.total_assigned ?? 0;
  const totalCompleted = progress?.total_completed ?? 0;

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "No due date";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  }

  async function handleAddStaff(e: FormEvent) {
    e.preventDefault();

    if (!organizationId) {
      setStaffError("Missing organization context.");
      return;
    }

    const name = newStaffName.trim();
    const email = newStaffEmail.trim();

    if (!name || !email) {
      setStaffError("Name and email are required.");
      return;
    }

    setStaffError(null);
    setAddingStaff(true);

    const { error } = await supabase.from("staff_members").insert({
      org_id: organizationId,
      full_name: name,
      email,
    });

    setAddingStaff(false);

    if (error) {
      console.error(error);
      setStaffError("Failed to add staff member. Please try again.");
      return;
    }

    setNewStaffName("");
    setNewStaffEmail("");
    await loadStaffMembers(organizationId);
  }

  async function handleDeleteStaff(id: string) {
    if (!organizationId) return;

    const confirmed = window.confirm(
      "Remove this staff member from your organization? This will not delete historical assignments, but they will no longer appear in your active staff list."
    );
    if (!confirmed) return;

    setDeletingId(id);
    const { error } = await supabase
      .from("staff_members")
      .delete()
      .eq("id", id)
      .eq("org_id", organizationId);

    setDeletingId(null);

    if (error) {
      console.error(error);
      setStaffError("Failed to remove staff member. Please try again.");
      return;
    }

    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
  }

  const isLoadingAny = loading || orgLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My competencies</h1>
            <p className="mt-1 text-sm text-foreground/60">
              See your overall completion and what’s coming due.
            </p>
          </div>

          <button onClick={() => router.push("/dashboard")} className={btnSoft}>
            ← Back to main dashboard
          </button>
        </div>

        {/* STATUS */}
        {isLoadingAny && (
          <div className={`${card} p-4 text-sm text-foreground/70`}>
            Loading your progress…
          </div>
        )}

        {!isLoadingAny && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!isLoadingAny && !error && (
          <>
            {/* TOP ROW: SHIELD + STATS */}
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className={`${card} flex items-center justify-center p-4`}>
                <ProgressShield value={completionRatio} label="My competency status" size={180} />
              </div>

              <div className={`${card} p-5 space-y-4`}>
                <h2 className="text-sm font-semibold">Summary</h2>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className={label}>Assigned</p>
                    <p className="mt-2 text-3xl font-semibold">{totalAssigned}</p>
                    <p className="mt-1 text-xs text-foreground/60">
                      Total competencies currently assigned to you.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className={label}>Completed</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-300">
                      {totalCompleted}
                    </p>
                    <p className="mt-1 text-xs text-foreground/60">
                      Completed and marked as done.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-foreground/60">
                  This shield updates automatically as your competencies are marked completed.
                </p>
              </div>
            </div>

            {/* ASSIGNMENT LIST */}
            <div className={card}>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">My assignments</h2>
                <p className="text-xs text-foreground/60">{assignments.length} total</p>
              </div>

              {assignments.length === 0 ? (
                <div className="px-4 py-6 text-sm text-foreground/60">
                  You have no competencies assigned right now.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full table-fixed text-sm">
                    <thead className="sticky top-0 bg-card/95 backdrop-blur text-xs uppercase tracking-wide text-foreground/60">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left font-semibold">Title</th>
                        <th className="w-32 px-3 py-2 text-left font-semibold">Status</th>
                        <th className="w-32 px-3 py-2 text-left font-semibold">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assignments.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/40">
                          <td className="px-3 py-2 align-middle font-semibold">
                            {a.competency_title || "(Untitled competency)"}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            <span className={pill}>{a.status}</span>
                          </td>
                          <td className="px-3 py-2 align-middle text-foreground/70">
                            {formatDate(a.due_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ORG STAFF MANAGEMENT */}
            {showManageStaff && (
              <div className={card}>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold">Organization staff</h2>
                  <p className="text-xs text-foreground/60">{staffMembers.length} total</p>
                </div>

                <div className="space-y-3 px-4 py-4">
                  <form
                    onSubmit={handleAddStaff}
                    className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <div className="space-y-1">
                      <label className={label}>Name</label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className={input}
                        placeholder="e.g., Alex Johnson"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={label}>Email</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className={input}
                        placeholder="name@example.com"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={addingStaff || !organizationId}
                        className={btnSmallPrimary}
                      >
                        {addingStaff ? "Adding…" : "Add staff"}
                      </button>
                    </div>
                  </form>

                  {staffError && (
                    <p className="text-sm text-red-200">{staffError}</p>
                  )}

                  {staffLoading ? (
                    <div className="py-4 text-sm text-foreground/60">
                      Loading staff list…
                    </div>
                  ) : staffMembers.length === 0 ? (
                    <div className="py-4 text-sm text-foreground/60">
                      No staff members found yet. Add your first team member above.
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-auto rounded-2xl border border-border">
                      <table className="min-w-full table-fixed text-sm">
                        <thead className="sticky top-0 bg-card/95 backdrop-blur text-xs uppercase tracking-wide text-foreground/60">
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left font-semibold">Name</th>
                            <th className="px-3 py-2 text-left font-semibold">Email</th>
                            <th className="w-16 px-3 py-2 text-right font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {staffMembers.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/40">
                              <td className="px-3 py-2 align-middle font-semibold">
                                {s.full_name || "(Unnamed staff)"}
                              </td>
                              <td className="px-3 py-2 align-middle text-foreground/70">
                                {s.email || "No email"}
                              </td>
                              <td className="px-3 py-2 text-right align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(s.id)}
                                  disabled={deletingId === s.id}
                                  className={btnIconDanger}
                                  title="Remove staff member"
                                >
                                  {deletingId === s.id ? (
                                    <span className="text-[10px]">…</span>
                                  ) : (
                                    <span aria-hidden="true">🗑️</span>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
