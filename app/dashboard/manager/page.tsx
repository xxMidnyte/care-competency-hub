// app/dashboard/manager/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Facility = { id: string; name: string | null };
type StaffMember = { id: string; full_name: string | null; email: string | null };
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
type CompetencyRow = { competency: Competency; assignment: Assignment | null };

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
type Drill = {
  id: string;
  facility_id: string;
  drill_type: string;
  started_at: string;
  ended_at: string | null;
  status: string;
};

const card = "rounded-2xl border border-border bg-card shadow-card";
const cardInner = "p-4"; // ✅ FIX: was referenced but not defined
const cardHeader = "border-b border-border px-4 py-3";
const cardBody = "px-4 py-4";
const muted = "text-foreground/60";
const label =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { loading: orgLoading, org, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const [competencyRows, setCompetencyRows] = useState<CompetencyRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);

  const [snapshot, setSnapshot] = useState<FacilitySnapshot | null>(null);
  const [staffSummary, setStaffSummary] = useState<StaffSummaryRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [drills, setDrills] = useState<Drill[]>([]);
  const [drillsLoading, setDrillsLoading] = useState(false);
  const [drillActionLoading, setDrillActionLoading] = useState(false);
  const [newDrillType, setNewDrillType] = useState<string>("Fire");
  const [newDrillStations, setNewDrillStations] = useState<string>(
    "Front entrance\nBack exit\nNurse station"
  );

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
    window.setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, timeout);
  }

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) router.push("/login");
    }
    checkAuth();
  }, [router]);

  // Load facilities
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

  // Overview
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

  // Drills
  useEffect(() => {
    if (!organizationId || !selectedFacilityId) {
      setDrills([]);
      return;
    }

    async function loadDrills() {
      setDrillsLoading(true);
      const { data, error } = await supabase
        .from("drills")
        .select("id, facility_id, drill_type, started_at, ended_at, status")
        .eq("org_id", organizationId)
        .eq("facility_id", selectedFacilityId)
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Drills load error:", error);
        flashMessage("error", "Unable to load emergency drills.");
        setDrills([]);
      } else {
        setDrills(data || []);
      }

      setDrillsLoading(false);
    }

    loadDrills();
  }, [organizationId, selectedFacilityId]);

  // Staff
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

  // Competencies + assignments
  useEffect(() => {
    if (!organizationId || !selectedFacilityId || !selectedStaffId) return;

    async function loadRows() {
      setRowsLoading(true);

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
      (assigns || []).forEach((a: any) =>
        assignmentsByComp.set(a.competency_id, a as Assignment)
      );

      const rows: CompetencyRow[] = (comps || []).map((c: any) => ({
        competency: c as Competency,
        assignment: assignmentsByComp.get(c.id) || null,
      }));

      setCompetencyRows(rows);
      setRowsLoading(false);
    }

    loadRows();
  }, [organizationId, selectedFacilityId, selectedStaffId]);

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

  async function handleStartDrill() {
    if (!organizationId || !selectedFacilityId) {
      flashMessage("error", "Select a facility first.");
      return;
    }

    const stations = newDrillStations
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (stations.length === 0) {
      flashMessage("error", "Add at least one drill station.");
      return;
    }

    try {
      setDrillActionLoading(true);

      const { data: drill, error: drillError } = await supabase
        .from("drills")
        .insert({
          org_id: organizationId,
          facility_id: selectedFacilityId,
          drill_type: newDrillType,
          status: "active",
        })
        .select("id, facility_id, drill_type, started_at, ended_at, status")
        .single();

      if (drillError || !drill) {
        console.error("Drill create error:", drillError);
        flashMessage("error", "Unable to start drill.");
        return;
      }

      const stationRows = stations.map((name, index) => ({
        drill_id: drill.id,
        name,
        order_index: index,
      }));

      const { error: stationError } = await supabase
        .from("drill_stations")
        .insert(stationRows);

      if (stationError) {
        console.error("Drill stations error:", stationError);
        flashMessage(
          "error",
          "Drill created, but there was an error saving stations."
        );
      } else {
        flashMessage("success", "Emergency drill started.");
      }

      setDrills((prev) => [drill as Drill, ...prev].slice(0, 5));
    } finally {
      setDrillActionLoading(false);
    }
  }

  async function handleEndDrill(drillId: string) {
    try {
      setDrillActionLoading(true);

      const { data, error } = await supabase
        .from("drills")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", drillId)
        .select("id, facility_id, drill_type, started_at, ended_at, status")
        .single();

      if (error || !data) {
        console.error("End drill error:", error);
        flashMessage("error", "Unable to end drill.");
        return;
      }

      setDrills((prev) =>
        prev.map((d) => (d.id === drillId ? (data as Drill) : d))
      );
      flashMessage("success", "Drill ended.");
    } finally {
      setDrillActionLoading(false);
    }
  }

  const role = org?.role;
  const isManagerOrAdmin = role === "admin" || role === "manager";

  const riskBadge = useMemo(() => {
    return (risk: string | null) => {
      if (!risk) return null;
      const base =
        "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold";
      const cls =
        risk === "Critical"
          ? "bg-red-500/10 text-red-300 border border-red-500/30"
          : risk === "High"
          ? "bg-orange-500/10 text-orange-300 border border-orange-500/30"
          : risk === "Medium"
          ? "bg-yellow-500/10 text-yellow-200 border border-yellow-500/30"
          : "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30";
      return <span className={`${base} ${cls}`}>{risk}</span>;
    };
  }, []);

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-4 text-sm text-red-200">
            Organization context could not be loaded. Please refresh the page or
            contact support.
          </div>
        </div>
      </div>
    );
  }

  if (!isManagerOrAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className={`${card} px-4 py-5 text-sm text-foreground/70`}>
            You don&apos;t have permission to access the manager dashboard.
            Please contact your administrator if you think this is a mistake.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Manager dashboard
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Overview by facility, emergency drills, and competency assignment
            tracking.
          </p>
        </div>

        {(error || success) && (
          <div className="space-y-2">
            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            )}
          </div>
        )}

        {/* Facility selector */}
        <div className={`${card} ${cardInner} space-y-2`}>
          <label className={label}>Facility</label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className={input}
          >
            <option value="">Select a facility…</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || "Unnamed facility"}
              </option>
            ))}
          </select>
          <p className="text-xs text-foreground/60">
            Pick a facility to load overview, drills, staff, and assignments.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Emergency drills */}
            <div className={card}>
              <div className={cardHeader}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Emergency drills</h2>
                    <p className="text-xs text-foreground/60">
                      Start a drill and log participation via QR check-ins.
                    </p>
                  </div>
                  {drillActionLoading && (
                    <span className="text-xs text-foreground/60">Working…</span>
                  )}
                </div>
              </div>

              <div className={cardBody}>
                {!selectedFacilityId ? (
                  <p className="text-sm text-foreground/60">
                    Select a facility to manage drills.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[0.7fr,1.3fr]">
                      <div className="space-y-2">
                        <label className={label}>Drill type</label>
                        <select
                          value={newDrillType}
                          onChange={(e) => setNewDrillType(e.target.value)}
                          className={input}
                        >
                          <option value="Fire">Fire</option>
                          <option value="Evacuation">Evacuation</option>
                          <option value="Tornado / Severe weather">
                            Tornado / Severe weather
                          </option>
                          <option value="Missing resident">Missing resident</option>
                          <option value="Code blue">Code blue</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={label}>Stations (one per line)</label>
                        <textarea
                          rows={3}
                          value={newDrillStations}
                          onChange={(e) => setNewDrillStations(e.target.value)}
                          className={`${input} resize-none`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleStartDrill}
                        disabled={drillActionLoading}
                        className={btnPrimary}
                      >
                        Start drill
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Recent drills</h3>
                        {drillsLoading && (
                          <span className="text-xs text-foreground/60">
                            Loading…
                          </span>
                        )}
                      </div>

                      {drills.length === 0 ? (
                        <p className="text-sm text-foreground/60">
                          No drills logged yet.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-border">
                          <table className="min-w-full text-sm">
                            <thead className="bg-muted text-foreground/60">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Type
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Started
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Status
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-[0.16em]">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {drills.map((d) => (
                                <tr
                                  key={d.id}
                                  className="border-t border-border"
                                >
                                  <td className="px-4 py-3">{d.drill_type}</td>
                                  <td className="px-4 py-3 text-foreground/70">
                                    {d.started_at
                                      ? d.started_at
                                          .slice(0, 16)
                                          .replace("T", " ")
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-foreground/70">
                                      {d.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right space-x-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(`/dashboard/drills/${d.id}`)
                                      }
                                      className={btnSoft}
                                    >
                                      View
                                    </button>
                                    {d.status === "active" && (
                                      <button
                                        type="button"
                                        onClick={() => handleEndDrill(d.id)}
                                        className={btnSoft}
                                      >
                                        End
                                      </button>
                                    )}
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
              </div>
            </div>

            {/* Overview */}
            <div className={card}>
              <div className={cardHeader}>
                <h2 className="text-sm font-semibold">Facility overview</h2>
                <p className="text-xs text-foreground/60">
                  Completion, assignment counts, and staff overdue rollups.
                </p>
              </div>

              <div className={cardBody}>
                {!selectedFacilityId ? (
                  <p className="text-sm text-foreground/60">
                    Select a facility to view overview.
                  </p>
                ) : overviewLoading ? (
                  <p className="text-sm text-foreground/60">
                    Loading facility overview…
                  </p>
                ) : overviewError ? (
                  <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                    {overviewError}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className={`${card} p-4`}>
                        <p className={label}>Completion rate</p>
                        <p className="mt-2 text-3xl font-semibold">
                          {snapshot?.completion_rate ?? 0}%
                        </p>
                        <div className="mt-3 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, snapshot?.completion_rate ?? 0)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className={`${card} p-4`}>
                        <p className={label}>Total assigned</p>
                        <p className="mt-2 text-3xl font-semibold">
                          {snapshot?.total_assigned ?? 0}
                        </p>
                      </div>

                      <div className={`${card} p-4`}>
                        <p className={label}>Overdue</p>
                        <p className="mt-2 text-3xl font-semibold">
                          {snapshot?.overdue_count ?? 0}
                        </p>
                        <p className="mt-2 text-xs text-foreground/60">
                          {(snapshot?.overdue_count ?? 0) > 0
                            ? "Action needed"
                            : "No overdue assignments"}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border">
                      <div className="bg-muted px-4 py-2">
                        <p className="text-sm font-semibold">Staff overview</p>
                        <p className="text-xs text-foreground/60">
                          Overdue counts and next due dates for this facility.
                        </p>
                      </div>

                      {staffSummary.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-foreground/60">
                          No staff compliance data yet for this facility.
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-auto">
                          <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-muted text-foreground/60">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Staff
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Role
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Overdue
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                                  Next due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {staffSummary.map((row) => (
                                <tr
                                  key={row.staff_id}
                                  className="border-t border-border"
                                >
                                  <td className="px-4 py-3">
                                    {row.full_name || "Unnamed staff"}
                                  </td>
                                  <td className="px-4 py-3 text-foreground/60">
                                    {row.role_title || "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.overdue_count}
                                  </td>
                                  <td className="px-4 py-3 text-foreground/60">
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: staff + competencies */}
          <div className="space-y-6">
            <div className={`${card} ${cardInner} space-y-2`}>
              <label className={label}>Staff member</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={!selectedFacilityId || staff.length === 0}
                className={input}
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
              <p className="text-xs text-foreground/60">
                Choose a person to assign competencies and track due dates.
              </p>
            </div>

            <div className={card}>
              <div className={cardHeader}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Competencies</h2>
                    <p className="text-xs text-foreground/60">
                      Assign, set due dates, and mark completion.
                    </p>
                  </div>
                  {saving && (
                    <span className="text-xs text-foreground/60">Saving…</span>
                  )}
                </div>
              </div>

              <div className={cardBody}>
                {!selectedFacilityId || !selectedStaffId ? (
                  <p className="text-sm text-foreground/60">
                    Select a facility and staff member to view competencies.
                  </p>
                ) : rowsLoading ? (
                  <p className="text-sm text-foreground/60">
                    Loading competencies…
                  </p>
                ) : competencyRows.length === 0 ? (
                  <p className="text-sm text-foreground/60">
                    No competencies found for this organization yet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <div className="max-h-[520px] overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-muted text-foreground/60">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                              Title
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                              Risk
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                              Due date
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-[0.16em]">
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
                                className="border-t border-border"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-semibold">
                                      {competency.title}
                                    </span>
                                    {roles.length > 0 && (
                                      <span className="mt-0.5 text-[11px] text-foreground/60">
                                        {roles.length === 1
                                          ? roles[0]
                                          : `${roles[0]} +${
                                              roles.length - 1
                                            } more`}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  {riskBadge(competency.risk)}
                                </td>

                                <td className="px-4 py-3">
                                  {isAssigned ? (
                                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-foreground/70">
                                      {isCompleted ? "Completed" : "Assigned"}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-foreground/60">
                                      Not assigned
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  {isAssigned && !isCompleted ? (
                                    <input
                                      type="date"
                                      className={input}
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
                                    <span className="text-sm text-foreground/60">
                                      Done {assignment.completed_at.slice(0, 10)}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-foreground/60">
                                      —
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {!isAssigned ? (
                                    <button
                                      onClick={() =>
                                        handleAssign(competency.id)
                                      }
                                      className={btnPrimary}
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
                                      className={btnPrimary}
                                    >
                                      Mark complete
                                    </button>
                                  ) : (
                                    <span className="text-sm text-foreground/60">
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
