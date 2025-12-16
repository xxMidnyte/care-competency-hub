// app/dashboard/assignments/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

type Status = "overdue" | "due_soon" | "on_track" | "completed";

type AssignmentCard = {
  id: string;

  staffId: string | null;
  competencyId: string | null;
  facilityId: string | null;

  staffName: string;
  competencyTitle: string;
  facilityName: string;

  role: string;
  discipline: string;

  dueDate: string | null; // YYYY-MM-DD or null
  status: Status;
  risk: "Low" | "Medium" | "High";

  // raw status string (db)
  dbStatus: string | null;
};

// --- temporary mock data (used only if we have no real rows yet) ---
const mockAssignments: AssignmentCard[] = [
  {
    id: "1",
    staffId: null,
    competencyId: null,
    facilityId: null,
    staffName: "Alex Johnson",
    competencyTitle: "Wound care – basic",
    facilityName: "CareCompetencyHub Demo – Home Health",
    role: "RN",
    discipline: "Nursing",
    dueDate: "2025-11-10",
    status: "overdue",
    risk: "High",
    dbStatus: "assigned",
  },
  {
    id: "2",
    staffId: null,
    competencyId: null,
    facilityId: null,
    staffName: "Maria Lopez",
    competencyTitle: "Medication administration",
    facilityName: "CareCompetencyHub Demo – SNF",
    role: "LPN",
    discipline: "Nursing",
    dueDate: "2025-11-30",
    status: "due_soon",
    risk: "Medium",
    dbStatus: "assigned",
  },
  {
    id: "3",
    staffId: null,
    competencyId: null,
    facilityId: null,
    staffName: "Sam Patel",
    competencyTitle: "OASIS documentation accuracy",
    facilityName: "CareCompetencyHub Demo – Home Health",
    role: "PT",
    discipline: "Therapy",
    dueDate: "2025-12-15",
    status: "on_track",
    risk: "High",
    dbStatus: "assigned",
  },
  {
    id: "4",
    staffId: null,
    competencyId: null,
    facilityId: null,
    staffName: "Jordan Lee",
    competencyTitle: "Fall prevention & safety",
    facilityName: "CareCompetencyHub Demo – SNF",
    role: "CNA",
    discipline: "Nursing",
    dueDate: "2025-10-01",
    status: "completed",
    risk: "Low",
    dbStatus: "completed",
  },
];

const statusLabels: Record<Status, string> = {
  overdue: "Overdue",
  due_soon: "Due this month",
  on_track: "On track",
  completed: "Completed",
};

function normalizeRisk(risk: string | null): "Low" | "Medium" | "High" {
  const r = (risk || "").toLowerCase();
  if (r === "high" || r === "critical") return "High";
  if (r === "medium") return "Medium";
  return "Low";
}

/**
 * Parse YYYY-MM-DD safely into a local date (prevents UTC shift bugs).
 */
function parseDateOnly(value: string) {
  const [y, m, d] = value.split("-").map((n) => Number(n));
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

/**
 * Coerce a Supabase date-ish value to YYYY-MM-DD (supports timestamptz strings).
 */
function coerceToDateOnly(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type DBAssignmentRow = {
  id: string;
  org_id: string;
  staff_id: string | null;
  competency_id: string | null;
  due_date: string | null;
  status: string | null;

  staff_members?: {
    id: string;
    full_name: string | null;
    email: string | null;
    facility_id: string | null;
    facilities?: { id: string; name: string | null } | null;
  } | null;

  competency_templates?: {
    id: string;
    title: string | null;
    risk: string | null;
  } | null;
};

function deriveStatusFromDb(status: string | null, due_date: string | null): Status {
  const s = (status || "").toLowerCase().trim();
  if (s === "completed" || s === "done" || s === "resolved") return "completed";

  if (!due_date) return "on_track";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dateOnly = coerceToDateOnly(due_date);
  const due = dateOnly ? parseDateOnly(dateOnly) : new Date(due_date);

  const diffMs = due.getTime() - startOfToday.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "due_soon";
  return "on_track";
}

function formatDueLabel(dueDate: string | null) {
  if (!dueDate) return "No due date";
  const dateOnly = coerceToDateOnly(dueDate);
  const d = dateOnly ? parseDateOnly(dateOnly) : new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "No due date";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const chipWrap = "inline-flex rounded-full border border-border bg-muted p-1 text-xs";
const chipBtnBase =
  "rounded-full px-3 py-1 transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

const modalOverlay =
  "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4";
const modalCard = "w-full max-w-lg rounded-2xl border border-border bg-card shadow-card";
const modalHeader = "flex items-center justify-between border-b border-border px-5 py-4";
const modalBody = "px-5 py-4 space-y-4";
const modalFooter = "flex items-center justify-end gap-2 border-t border-border px-5 py-4";

const label = "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const select =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";

export default function AssignmentsPage() {
  const router = useRouter();
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [assignments, setAssignments] = useState<AssignmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<"assigned" | "completed" | "in_progress">(
    "assigned"
  );
  const [nextDueDate, setNextDueDate] = useState<string>("");

  const canViewAssignments = userRole === "dev" || userRole === "admin" || userRole === "manager";

  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      setLoading(true);
      setError(null);

      if (!organizationId) {
        setError("Unable to load organization.");
        setAssignments([]);
        setLoading(false);
        return;
      }

      if (!canViewAssignments) {
        setError("You don’t have permission to view assignments.");
        setAssignments([]);
        setLoading(false);
        return;
      }

      try {
        // ✅ Pull facility via staff_members.facility_id -> facilities
        // ✅ Pull competency title/risk via competency_templates
        const { data, error: assignError } = await supabase
          .from("staff_competency_assignments")
          .select(
            `
            id,
            org_id,
            staff_id,
            competency_id,
            due_date,
            status,
            staff_members:staff_id (
              id,
              full_name,
              email,
              facility_id,
              facilities:facility_id ( id, name )
            ),
            competency_templates:competency_id (
              id,
              title,
              risk
            )
          `
          )
          .eq("org_id", organizationId)
          .order("due_date", { ascending: true });

        if (assignError) {
          console.error("Assignments load error:", assignError);
          const msg = (assignError as any)?.message || "Failed to load assignments.";
          setError(`Failed to load assignments. (${msg})`);
          setAssignments([]);
          setLoading(false);
          return;
        }

        const rows = (data || []) as DBAssignmentRow[];

        if (rows.length === 0) {
          setAssignments(mockAssignments);
          setLoading(false);
          return;
        }

        const mapped: AssignmentCard[] = rows.map((row) => {
          const staffName =
            row.staff_members?.full_name ||
            row.staff_members?.email ||
            "Unknown staff";

          const facilityName =
            row.staff_members?.facilities?.name ||
            "—";

          const competencyTitle =
            row.competency_templates?.title || "Untitled competency";

          const risk = normalizeRisk(row.competency_templates?.risk || null);

          const dateOnly = row.due_date ? coerceToDateOnly(row.due_date) : null;
          const derived = deriveStatusFromDb(row.status, row.due_date);

          return {
            id: row.id,

            staffId: row.staff_id ?? null,
            competencyId: row.competency_id ?? null,
            facilityId: row.staff_members?.facility_id ?? null,

            staffName,
            competencyTitle,
            facilityName,

            role: "",
            discipline: "",

            dueDate: dateOnly,
            status: derived,
            risk,

            dbStatus: row.status,
          };
        });

        setAssignments(mapped);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error loading assignments:", err);
        setError("Server error loading assignments.");
        setAssignments([]);
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, organizationId, canViewAssignments]);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return assignments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;

      const haystack = [a.staffName, a.competencyTitle, a.facilityName, a.role, a.discipline]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [search, statusFilter, assignments]);

  const isLoadingAny = loading || orgLoading;

  const stats = useMemo(() => {
    let total = assignments.length;
    let overdue = 0;
    let dueSoon = 0;
    let onTrack = 0;
    let completed = 0;

    for (const a of assignments) {
      if (a.status === "overdue") overdue++;
      else if (a.status === "due_soon") dueSoon++;
      else if (a.status === "on_track") onTrack++;
      else completed++;
    }

    return { total, overdue, dueSoon, onTrack, completed };
  }, [assignments]);

  function openUpdateModal(a: AssignmentCard) {
    setModalError(null);
    setEditing(a);

    const s = (a.dbStatus || "").toLowerCase().trim();
    if (s === "completed") setNextStatus("completed");
    else if (s === "in_progress" || s === "in progress") setNextStatus("in_progress");
    else setNextStatus("assigned");

    setNextDueDate(a.dueDate || "");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setModalError(null);
    setNextDueDate("");
    setNextStatus("assigned");
  }

  async function handleSaveStatus() {
    setModalError(null);
    if (!editing) return;

    // demo row
    if (!editing.staffId || !editing.competencyId) {
      setModalError("This is demo data. Create a real assignment to update status.");
      return;
    }

    setSaving(true);

    try {
      const payload: any = { status: nextStatus };
      payload.due_date = nextDueDate ? nextDueDate : null;

      const { error: updateErr } = await supabase
        .from("staff_competency_assignments")
        .update(payload)
        .eq("id", editing.id);

      if (updateErr) {
        console.error(updateErr);
        setModalError(updateErr.message || "Failed to update assignment.");
        setSaving(false);
        return;
      }

      // optimistic local update
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== editing.id) return a;

          const derived = deriveStatusFromDb(nextStatus, nextDueDate ? nextDueDate : null);

          return {
            ...a,
            dueDate: nextDueDate ? nextDueDate : null,
            dbStatus: nextStatus,
            status: derived,
          };
        })
      );

      setSaving(false);
      closeModal();
    } catch (e) {
      console.error(e);
      setModalError("Unexpected error updating assignment.");
      setSaving(false);
    }
  }

  function handleViewDetails(a: AssignmentCard) {
    if (!a.competencyId) return;
    router.push(`/dashboard/library/${a.competencyId}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">Assignments</h1>
            <p className="text-sm text-muted-foreground">
              See which staff are assigned to which competencies, and what is overdue vs on track.
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/manager/assign")}>
            New assignment
          </Button>
        </div>

        {/* Stats */}
        {!isLoadingAny && !error && (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-foreground/80">
              <span className="font-semibold text-foreground">{stats.total}</span> total
            </span>
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-500">
              <span className="font-semibold">{stats.overdue}</span> overdue
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-500">
              <span className="font-semibold">{stats.dueSoon}</span> due this month
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <span className="font-semibold">{stats.onTrack}</span> on track
            </span>
            <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.completed}</span> completed
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className={chipWrap}>
            {[
              { key: "all", label: "All" },
              { key: "overdue", label: "Overdue" },
              { key: "due_soon", label: "Due this month" },
              { key: "on_track", label: "On track" },
              { key: "completed", label: "Completed" },
            ].map((item) => {
              const active = statusFilter === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key === "all" ? "all" : (item.key as Status))}
                  className={`${chipBtnBase} ${
                    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="w-full max-w-xs">
            <input
              type="text"
              placeholder="Search by staff, competency, facility…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]"
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoadingAny && (
            <div className="rounded-2xl border border-border bg-card shadow-card p-4 text-sm text-muted-foreground">
              Loading assignments…
            </div>
          )}

          {!isLoadingAny && error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-foreground">
              {error}
            </div>
          )}

          {!isLoadingAny && !error && filteredAssignments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No assignments match your filters.</p>
              <p className="mt-1">
                Try adjusting the status filter or search, or create a new assignment for a staff member.
              </p>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard/manager/assign")}>
                  Create assignment
                </Button>
              </div>
            </div>
          )}

          {!isLoadingAny &&
            !error &&
            filteredAssignments.map((a) => {
              const statusLabel = statusLabels[a.status];

              const statusColor =
                a.status === "overdue"
                  ? "text-red-500 bg-red-500/10 border-red-500/30"
                  : a.status === "due_soon"
                  ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                  : a.status === "on_track"
                  ? "text-primary bg-primary/10 border-primary/30"
                  : "text-muted-foreground bg-muted/40 border-border";

              const riskColor =
                a.risk === "High"
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : a.risk === "Medium"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-primary/10 text-primary border-primary/30";

              const dueLabel = formatDueLabel(a.dueDate);

              return (
                <div key={a.id} className="rounded-2xl border border-border bg-card shadow-card p-4 text-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{a.staffName}</p>
                        {(a.role || a.discipline) && (
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                            {[a.role, a.discipline].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>

                      <p className="text-[12px] text-foreground/80">{a.competencyTitle}</p>
                      <p className="text-[11px] text-muted-foreground">{a.facilityName}</p>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`rounded-full border px-2 py-0.5 ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 ${riskColor}`}>
                          Risk: {a.risk}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Due <span className="font-medium text-foreground">{dueLabel}</span>
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleViewDetails(a)}
                          disabled={!a.competencyId}
                          title={!a.competencyId ? "Demo assignment" : "View competency"}
                        >
                          View details
                        </Button>

                        <Button variant="secondary" size="xs" onClick={() => openUpdateModal(a)}>
                          Update status
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Update Status Modal */}
      {modalOpen && editing && (
        <div className={modalOverlay} role="dialog" aria-modal="true">
          <div className={modalCard}>
            <div className={modalHeader}>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">Update assignment</div>
                <div className="text-xs text-muted-foreground">
                  {editing.staffName} · {editing.competencyTitle}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={modalBody}>
              {modalError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-foreground">
                  {modalError}
                </div>
              )}

              <div className="space-y-1">
                <div className={label}>Status</div>
                <select
                  className={select}
                  value={nextStatus}
                  onChange={(e) =>
                    setNextStatus(e.target.value as "assigned" | "completed" | "in_progress")
                  }
                  disabled={saving}
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className={label}>Due date</div>
                <input
                  type="date"
                  className={input}
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  disabled={saving}
                />
                <div className="text-[11px] text-muted-foreground">
                  Leave blank to remove the due date.
                </div>
              </div>
            </div>

            <div className={modalFooter}>
              <Button variant="secondary" size="sm" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveStatus} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
