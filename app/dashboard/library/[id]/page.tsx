// app/dashboard/library/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Competency = {
  id: string;
  org_id: string;
  title: string | null;
  content: any; // JSONB from Supabase
  risk: string | null;
  created_at: string;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const SECTION_LABELS: Record<string, string> = {
  purpose: "Purpose",
  objectives: "Learning objectives",
  equipment: "Required equipment",
  procedure: "Procedure / steps",
  checklist: "Return demo checklist",
  quiz: "Quiz questions",
  policy: "Policy references",
  documentation: "Documentation expectations",
  evidence: "Evidence requirements",
};

export default function CompetencyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competencyId = params?.id as string | undefined;

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const [competency, setCompetency] = useState<Competency | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const canAssign =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      if (!competencyId) {
        setError("Invalid competency id.");
        setLoading(false);
        return;
      }

      if (orgLoading) {
        // wait for org context
        return;
      }

      // 1) Auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to view this competency.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 2) Org context (from useOrg)
      if (!organizationId) {
        console.error("No organizationId in context");
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      // 3) Load competency (scoped to org)
      const { data: comp, error: compError } = await supabase
        .from("competency_templates")
        .select("id, org_id, title, content, risk, created_at")
        .eq("id", competencyId)
        .eq("org_id", organizationId)
        .single();

      if (compError || !comp) {
        console.error(compError);
        setError("Competency not found.");
        setLoading(false);
        return;
      }

      setCompetency(comp as Competency);

      // 4) Load staff for this org (only if someone can assign)
      if (canAssign) {
        const { data: staffRows, error: staffError } = await supabase
          .from("staff_members")
          .select("id, full_name, email")
          .eq("org_id", organizationId)
          .order("full_name", { ascending: true });

        if (staffError) {
          console.error(staffError);
          setError("Unable to load staff list.");
          setLoading(false);
          return;
        }

        setStaff((staffRows as StaffMember[]) || []);
      }

      setLoading(false);
    }

    load();
  }, [competencyId, orgLoading, organizationId, canAssign]);

  function riskBadge(risk: string | null) {
    const r = (risk || "").toLowerCase();
    if (r === "high")
      return "bg-red-500/15 text-red-300 border border-red-500/70";
    if (r === "medium")
      return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/70";
    if (r === "low")
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/70";
    if (r === "critical")
      return "bg-amber-500/15 text-amber-300 border border-amber-500/70";
    return "bg-slate-700/40 text-slate-100 border border-slate-600/60";
  }

  function riskLabel(risk: string | null) {
    if (!risk) return "Unspecified";
    return risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
  }

  function toggleStaff(id: string) {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleAssign() {
    setAssignError(null);
    setAssignSuccess(null);

    if (!canAssign) {
      setAssignError("You don’t have permission to assign competencies.");
      return;
    }

    if (!competency || !organizationId || !userId) {
      setAssignError("Missing competency or organization context.");
      return;
    }

    if (selectedStaffIds.length === 0) {
      setAssignError("Select at least one staff member to assign to.");
      return;
    }

    setAssigning(true);

    const payload = selectedStaffIds.map((staffId) => ({
      org_id: organizationId,
      staff_id: staffId,
      competency_id: competency.id,
      assigned_by: userId,
      due_date: dueDate ? dueDate : null,
      status: "assigned",
      notes: notes || null,
      competency_title: competency.title,
      competency_content: competency.content,
      competency_risk: competency.risk,
    }));

    const { error } = await supabase
      .from("staff_competency_assignments")
      .insert(payload);

    setAssigning(false);

    if (error) {
      console.error(error);
      setAssignError("Failed to assign competency. Please try again.");
      return;
    }

    setAssignSuccess(
      `Assigned to ${selectedStaffIds.length} staff member${
        selectedStaffIds.length > 1 ? "s" : ""
      }.`
    );
  }

  // ---- Format content sections nicely ----
  const rawContent = competency?.content;
  let sections: Record<string, string> = {};

  if (rawContent && typeof rawContent === "object") {
    sections = rawContent as Record<string, string>;
  } else if (typeof rawContent === "string") {
    try {
      sections = JSON.parse(rawContent);
    } catch {
      sections = { content: rawContent };
    }
  }

  const sectionEntries = Object.entries(sections).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0
  );

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl p-8">
          <p className="text-sm text-slate-300">Loading competency…</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !competency) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl space-y-4 p-8">
          <Link
            href="/dashboard/library"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Back to library
          </Link>
          <p className="text-sm text-red-400">
            {error || "Unable to load competency."}
          </p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-8 lg:flex-row">
        {/* LEFT: Competency content */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Link
                href="/dashboard/library"
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Back to library
              </Link>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
                {competency.title || "Untitled competency"}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${riskBadge(
                    competency.risk
                  )}`}
                >
                  Risk: {riskLabel(competency.risk)}
                </span>
                <span>
                  Created:{" "}
                  {competency.created_at
                    ? new Date(competency.created_at).toLocaleString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-100">
            {sectionEntries.length === 0 ? (
              <p>No content saved for this competency yet.</p>
            ) : (
              <div className="space-y-4">
                {sectionEntries.map(([key, value]) => {
                  const label =
                    SECTION_LABELS[key] ??
                    key.charAt(0).toUpperCase() + key.slice(1);

                  return (
                    <div
                      key={key}
                      className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0"
                    >
                      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                      </h3>
                      <pre className="whitespace-pre-wrap text-sm text-slate-100">
                        {value}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Assign to staff (only if allowed) */}
        {canAssign && (
          <div className="w-full max-w-sm space-y-4 rounded-lg border border-slate-800 bg-slate-950/80 p-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Assign to staff
            </h2>
            <p className="text-xs text-slate-400">
              Select staff members, choose an optional due date, and create
              competency assignments.
            </p>

            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/80 p-2">
              {staff.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-500">
                  No staff members found for this organization yet.
                </p>
              )}

              {staff.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-slate-900/80"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    checked={selectedStaffIds.includes(s.id)}
                    onChange={() => toggleStaff(s.id)}
                  />
                  <span className="flex flex-col">
                    <span className="text-slate-100">
                      {s.full_name || "(Unnamed staff)"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {s.email || "No email"}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Due date (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Manager notes (optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
                placeholder="Any special instructions, context, or expectations."
              />
            </div>

            {assignError && (
              <p className="text-xs text-red-400">{assignError}</p>
            )}
            {assignSuccess && (
              <p className="text-xs text-emerald-400">{assignSuccess}</p>
            )}

            <button
              onClick={handleAssign}
              disabled={assigning}
              className="mt-1 w-full rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigning ? "Assigning…" : "Assign competency"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
