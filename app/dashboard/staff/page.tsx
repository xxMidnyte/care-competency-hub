// app/dashboard/staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProgressShield from "@/components/ProgressShield";
import { useRouter } from "next/navigation";

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

export default function StaffDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StaffProgressRow | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [orgId, setOrgId] = useState<string | null>(null);

  // Org staff management state
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMemberRow[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // NOTE: Right now this is always true so you can use the UI.
  // When your roles are finalized, gate this like:
  // const showManageStaff = profile.role in ["manager","admin"]
  const showManageStaff = true;

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
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
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

      // 1) Get org_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.org_id) {
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      const orgIdValue = profile.org_id as string;
      setOrgId(orgIdValue);

      // 2) Fetch progress from view
      const { data: progressRows, error: progressError } = await supabase
        .from("staff_competency_progress")
        .select("*")
        .eq("org_id", orgIdValue)
        .eq("email", userEmail)
        .limit(1);

      if (progressError) {
        console.error(progressError);
        setError("Unable to load your competency progress.");
        setLoading(false);
        return;
      }

      const row = (progressRows && progressRows[0]) || null;
      setProgress(row as StaffProgressRow | null);

      // 3) Fetch current assignments for this staff member (if any)
      if (row?.staff_id) {
        const { data: assignRows, error: assignError } = await supabase
          .from("staff_competency_assignments")
          .select("id, competency_title, status, due_date, assigned_at")
          .eq("staff_id", row.staff_id)
          .order("due_date", { ascending: true });

        if (assignError) {
          console.error(assignError);
          setError("Unable to load your assignments.");
          setLoading(false);
          return;
        }

        setAssignments((assignRows || []) as AssignmentRow[]);
      }

      // 4) Load org staff list (for manager/admin UI)
      if (orgIdValue && showManageStaff) {
        await loadStaffMembers(orgIdValue);
      }

      setLoading(false);
    }

    load();
  }, [showManageStaff]);

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
    if (!orgId) {
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
      org_id: orgId,
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
    await loadStaffMembers(orgId);
  }

  async function handleDeleteStaff(id: string) {
    if (!orgId) return;

    const confirmed = window.confirm(
      "Remove this staff member from your organization? This will not delete historical assignments, but they will no longer appear in your active staff list."
    );
    if (!confirmed) return;

    setDeletingId(id);
    const { error } = await supabase
      .from("staff_members")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    setDeletingId(null);

    if (error) {
      console.error(error);
      setStaffError("Failed to remove staff member. Please try again.");
      return;
    }

    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            My competencies
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            See your overall completion and what’s coming due.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs font-medium text-slate-400 hover:text-slate-100"
        >
          ← Back to main dashboard
        </button>
      </div>

      {/* STATUS */}
      {loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
          Loading your progress…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* TOP ROW: SHIELD + STATS */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Shield card */}
            <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <ProgressShield
                value={completionRatio}
                label="My competency status"
                size={180}
              />
            </div>

            {/* Stats card */}
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <h2 className="text-sm font-semibold text-slate-100">
                Summary
              </h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-xs text-slate-400">Assigned</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-50">
                    {totalAssigned}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Total competencies currently assigned to you.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-400">
                    {totalCompleted}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Completed and marked as done.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                This shield updates automatically as your competencies are
                marked completed.
              </p>
            </div>
          </div>

          {/* ASSIGNMENT LIST */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">
                My assignments
              </h2>
              <p className="text-xs text-slate-400">
                {assignments.length} total
              </p>
            </div>

            {assignments.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-400">
                You have no competencies assigned right now.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <table className="min-w-full table-fixed text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Title</th>
                      <th className="w-32 px-3 py-2 text-left">Status</th>
                      <th className="w-32 px-3 py-2 text-left">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-900/60">
                        <td className="px-3 py-2 align-middle text-slate-100">
                          {a.competency_title || "(Untitled competency)"}
                        </td>
                        <td className="px-3 py-2 align-middle text-slate-300">
                          {a.status}
                        </td>
                        <td className="px-3 py-2 align-middle text-slate-300">
                          {formatDate(a.due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ORG STAFF MANAGEMENT (manager/admin) */}
          {showManageStaff && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-100">
                  Organization staff
                </h2>
                <p className="text-xs text-slate-400">
                  {staffMembers.length} total
                </p>
              </div>

              <div className="space-y-3 px-4 py-4">
                {/* Add staff form */}
                <form
                  onSubmit={handleAddStaff}
                  className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/90 p-3 md:flex-row md:items-center"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                      placeholder="e.g., Alex Johnson"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="mt-2 md:mt-5">
                    <button
                      type="submit"
                      disabled={addingStaff || !orgId}
                      className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingStaff ? "Adding…" : "Add staff"}
                    </button>
                  </div>
                </form>

                {staffError && (
                  <p className="text-xs text-red-400">{staffError}</p>
                )}

                {/* Staff table */}
                {staffLoading ? (
                  <div className="py-4 text-sm text-slate-400">
                    Loading staff list…
                  </div>
                ) : staffMembers.length === 0 ? (
                  <div className="py-4 text-sm text-slate-400">
                    No staff members found yet. Add your first team member
                    above.
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-800">
                    <table className="min-w-full table-fixed text-sm">
                      <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="w-16 px-3 py-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {staffMembers.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/60">
                            <td className="px-3 py-2 align-middle text-slate-100">
                              {s.full_name || "(Unnamed staff)"}
                            </td>
                            <td className="px-3 py-2 align-middle text-slate-300">
                              {s.email || "No email"}
                            </td>
                            <td className="px-3 py-2 text-right align-middle">
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(s.id)}
                                disabled={deletingId === s.id}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Remove staff member"
                              >
                                {deletingId === s.id ? (
                                  <span className="text-[10px]">…</span>
                                ) : (
                                  // simple garbage can icon
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
  );
}
