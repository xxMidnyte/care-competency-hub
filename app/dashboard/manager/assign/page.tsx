// app/dashboard/manager/assign/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

const COMPETENCY_TABLE = "competency_templates"; // change if needed
const STAFF_TABLE = "staff_members";
const ASSIGNMENTS_TABLE = "staff_competency_assignments";

type Facility = {
  id: string;
  name: string | null;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  facility_id: string | null;
};

type Competency = {
  id: string;
  org_id: string;
  title: string;
  content?: string | null;
  body?: string | null;
  risk_level?: string | null;
};

export default function ManagerAssignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competencyId = searchParams.get("competencyId");

  const { loading: orgLoading, org, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  );
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(
    () => new Set()
  );

  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [competency, setCompetency] = useState<Competency | null>(null);

  const visibleStaff = useMemo(() => {
    if (!selectedFacilityId) return staff;
    return staff.filter((s) => s.facility_id === selectedFacilityId);
  }, [staff, selectedFacilityId]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    if (orgLoading) return;

    if (!organizationId) {
      setError("Organization context is missing. Please contact support.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      const { data: facData, error: facError } = await supabase
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

      setFacilities(facData || []);
      if (facData && facData.length > 0) {
        setSelectedFacilityId(facData[0].id);
      }

      // ✅ FIX: removed `.eq("is_active", true)` since column doesn't exist
      const { data: staffData, error: staffError } = await supabase
        .from(STAFF_TABLE)
        .select("id, full_name, email, facility_id")
        .eq("org_id", organizationId)
        .order("full_name", { ascending: true });

      if (staffError) {
        console.error("Staff load error:", staffError);
        setError("Unable to load staff.");
        setLoading(false);
        return;
      }

      setStaff(staffData || []);

      if (competencyId) {
        const { data: compData, error: compError } = await supabase
          .from(COMPETENCY_TABLE)
          .select("id, org_id, title, content, body, risk_level")
          .eq("id", competencyId)
          .eq("org_id", organizationId)
          .single();

        if (compError || !compData) {
          console.error("Competency load error:", compError);
          setError("Unable to load selected competency.");
          setLoading(false);
          return;
        }

        setCompetency(compData as Competency);
      }

      setLoading(false);
    }

    load();
  }, [organizationId, orgLoading, competencyId]);

  function toggleStaffSelection(id: string) {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!organizationId || !userId) return;

    if (!competency) {
      setError("No competency loaded to assign.");
      return;
    }
    if (selectedStaffIds.size === 0) {
      setError("Select at least one staff member to assign this competency.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const contentSnapshot =
        competency.content ?? competency.body ?? "(No detailed content stored.)";

      const payload = Array.from(selectedStaffIds).map((staffId) => ({
        org_id: organizationId,
        staff_id: staffId,
        competency_id: competency.id,
        assigned_by: userId,
        due_date: dueDate || null,
        status: "assigned",
        notes: notes || null,
        competency_title: competency.title,
        competency_content: contentSnapshot,
        competency_risk: competency.risk_level ?? null,
      }));

      const { error: insertError } = await supabase
        .from(ASSIGNMENTS_TABLE)
        .insert(payload);

      if (insertError) {
        console.error("Assignment insert error:", insertError);
        setError("Failed to assign competency. Please try again.");
        setSaving(false);
        return;
      }

      setSuccess(
        `Assigned to ${selectedStaffIds.size} staff member${
          selectedStaffIds.size > 1 ? "s" : ""
        }.`
      );
      setSaving(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while assigning competency.");
      setSaving(false);
    }
  }

  const role = org?.role;
  const isManagerOrAdmin = role === "admin" || role === "manager";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Assign competency
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Choose who should complete this competency and set a due date.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/library")}
            className="text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            ← Back to library
          </button>
        </div>

        {orgLoading || loading ? (
          <div className="px-6 py-8 text-sm text-slate-400">Loading…</div>
        ) : !organizationId ? (
          <div className="rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-6 text-sm text-red-100">
            Organization context could not be loaded. Please refresh the page or
            contact support if this continues.
          </div>
        ) : !isManagerOrAdmin ? (
          <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] px-4 py-6 text-sm text-slate-300">
            You don&apos;t have permission to assign competencies. Please contact
            your administrator if you think this is a mistake.
          </div>
        ) : (
          <>
            {competency && (
              <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Selected competency
                </p>
                <p className="mt-1 text-sm font-medium">{competency.title}</p>
                {competency.risk_level && (
                  <p className="mt-1 text-xs text-slate-400">
                    Risk level:{" "}
                    <span className="font-medium">
                      {competency.risk_level.toUpperCase()}
                    </span>
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-900/30 px-4 py-2 text-xs text-emerald-200">
                {success}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <div className="space-y-3 rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4">
                <h2 className="text-sm font-semibold">
                  Who should complete this?
                </h2>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">
                    Facility
                  </label>
                  <select
                    value={selectedFacilityId ?? ""}
                    onChange={(e) =>
                      setSelectedFacilityId(e.target.value || null)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {facilities.length === 0 && (
                      <option value="">No facilities found</option>
                    )}
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name || "(Unnamed facility)"}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-200">
                    {visibleStaff.length}
                  </span>{" "}
                  staff in this facility.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4">
                <h2 className="text-sm font-semibold">Assignment details</h2>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">
                    Due date (optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="E.g., Annual med pass review, must be done before next survey."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[var(--surface)] px-4 py-3">
                <h2 className="text-sm font-semibold">
                  Staff in this facility
                </h2>
                <p className="text-xs text-slate-400">
                  Selected:{" "}
                  <span className="font-semibold text-emerald-400">
                    {selectedStaffIds.size}
                  </span>
                </p>
              </div>

              {visibleStaff.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400">
                  No staff found for this facility.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full table-fixed text-sm">
                    <thead className="sticky top-0 bg-[var(--surface)] text-xs uppercase tracking-wide text-slate-400 backdrop-blur">
                      <tr className="border-b border-slate-900/60">
                        <th className="w-10 px-3 py-2 text-left">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleStaff.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-slate-900/60 hover:bg-slate-900/40"
                          onClick={() => toggleStaffSelection(s.id)}
                        >
                          <td className="px-3 py-2 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedStaffIds.has(s.id)}
                              onChange={() => toggleStaffSelection(s.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 cursor-pointer accent-emerald-500"
                            />
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {s.full_name || "(No name)"}
                          </td>
                          <td className="px-3 py-2 align-middle text-slate-300">
                            {s.email || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                You’re assigning this competency{" "}
                {dueDate ? (
                  <>
                    with a due date of{" "}
                    <span className="font-semibold text-slate-200">
                      {dueDate}
                    </span>
                    .
                  </>
                ) : (
                  "with no due date."
                )}
              </div>

              <button
                onClick={handleAssign}
                disabled={saving || selectedStaffIds.size === 0 || !competency}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {saving ? "Assigning…" : "Assign competency"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
