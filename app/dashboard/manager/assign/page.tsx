// app/dashboard/manager/assign/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

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

  // Derived: filtered staff by facility
  const visibleStaff = useMemo(() => {
    if (!selectedFacilityId) return staff;
    return staff.filter((s) => s.facility_id === selectedFacilityId);
  }, [staff, selectedFacilityId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in as a manager to assign competencies.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 2) Profile/org
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id, org_role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.org_id) {
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      setOrgId(profile.org_id);

      // TODO: later you can enforce org_role in ('manager','admin','dev')

      const orgId = profile.org_id;

      // 3) Facilities
      const { data: facData, error: facError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (facError) {
        console.error(facError);
        setError("Unable to load facilities.");
        setLoading(false);
        return;
      }

      setFacilities(facData || []);
      if (facData && facData.length > 0) {
        setSelectedFacilityId(facData[0].id);
      }

      // 4) Staff
      const { data: staffData, error: staffError } = await supabase
        .from(STAFF_TABLE)
        .select("id, full_name, email, facility_id")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (staffError) {
        console.error(staffError);
        setError("Unable to load staff.");
        setLoading(false);
        return;
      }

      setStaff(staffData || []);

      // 5) Competency (optional but typical)
      if (competencyId) {
        const { data: compData, error: compError } = await supabase
          .from(COMPETENCY_TABLE)
          .select("id, org_id, title, content, body, risk_level")
          .eq("id", competencyId)
          .eq("org_id", orgId)
          .single();

        if (compError || !compData) {
          console.error(compError);
          setError("Unable to load selected competency.");
          setLoading(false);
          return;
        }

        setCompetency(compData as Competency);
      }

      setLoading(false);
    }

    load();
  }, [competencyId]);

  function toggleStaffSelection(id: string) {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!orgId || !userId) return;
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
        org_id: orgId,
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
        console.error(insertError);
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

      // Optional: clear notes but keep selection
      // setSelectedStaffIds(new Set());
      // setNotes("");
    } catch (err) {
      console.error(err);
      setError("Unexpected error while assigning competency.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Assign competency
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Choose who should complete this competency and set a due date.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/library")}
          className="text-xs font-medium text-slate-400 hover:text-slate-100"
        >
          ← Back to library
        </button>
      </div>

      {/* Selected competency summary */}
      {competency && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Selected competency
          </p>
          <p className="mt-1 text-sm font-medium text-slate-50">
            {competency.title}
          </p>
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

      {loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
          Loading facilities, staff, and competency…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Top controls: facility, due date, notes */}
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            {/* Left: staff filters */}
            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Who should complete this?
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">
                  Facility
                </label>
                <select
                  value={selectedFacilityId ?? ""}
                  onChange={(e) =>
                    setSelectedFacilityId(
                      e.target.value || null
                    )
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                >
                  {facilities.length === 0 && (
                    <option value="">No facilities found</option>
                  )}
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
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

            {/* Right: due date + notes */}
            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Assignment details
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">
                  Due date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
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
                  className="w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="E.g., Annual med pass review, must be done before next survey."
                />
              </div>
            </div>
          </div>

          {/* Staff table */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">
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
                  <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="w-10 px-3 py-2 text-left">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {visibleStaff.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-900/60"
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
                        <td className="px-3 py-2 align-middle text-slate-100">
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

          {/* Footer actions */}
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
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {saving ? "Assigning…" : "Assign competency"}
            </button>
          </div>

          {success && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-900/30 px-4 py-2 text-xs text-emerald-200">
              {success}
            </div>
          )}
        </>
      )}
    </div>
  );
}
