// app/dashboard/assignments/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Status = "overdue" | "due_soon" | "on_track" | "completed";

type AssignmentCard = {
  id: string;
  staffName: string;
  competencyTitle: string;
  facilityName: string;
  role: string;
  discipline: string;
  dueDate: string | null; // ISO date string or null
  status: Status;
  risk: "Low" | "Medium" | "High";
};

// --- temporary mock data (used only if we have no real rows yet) ---
const mockAssignments: AssignmentCard[] = [
  {
    id: "1",
    staffName: "Alex Johnson",
    competencyTitle: "Wound care – basic",
    facilityName: "CareCompetencyHub Demo – Home Health",
    role: "RN",
    discipline: "Nursing",
    dueDate: "2025-11-10",
    status: "overdue",
    risk: "High",
  },
  {
    id: "2",
    staffName: "Maria Lopez",
    competencyTitle: "Medication administration",
    facilityName: "CareCompetencyHub Demo – SNF",
    role: "LPN",
    discipline: "Nursing",
    dueDate: "2025-11-30",
    status: "due_soon",
    risk: "Medium",
  },
  {
    id: "3",
    staffName: "Sam Patel",
    competencyTitle: "OASIS documentation accuracy",
    facilityName: "CareCompetencyHub Demo – Home Health",
    role: "PT",
    discipline: "Therapy",
    dueDate: "2025-12-15",
    status: "on_track",
    risk: "High",
  },
  {
    id: "4",
    staffName: "Jordan Lee",
    competencyTitle: "Fall prevention & safety",
    facilityName: "CareCompetencyHub Demo – SNF",
    role: "CNA",
    discipline: "Nursing",
    dueDate: "2025-10-01",
    status: "completed",
    risk: "Low",
  },
];

const statusLabels: Record<Status, string> = {
  overdue: "Overdue",
  due_soon: "Due this month",
  on_track: "On track",
  completed: "Completed",
};

type DBAssignment = {
  id: string;
  org_id: string;
  staff_id: string;
  competency_id: string;
  competency_title: string | null;
  competency_risk: string | null;
  due_date: string | null;
  status: string | null; // e.g. "assigned", "completed"
};

type DBStaff = {
  id: string;
  full_name: string | null;
  // if you later add role/discipline/facility_id, you can extend this
};

function normalizeRisk(risk: string | null): "Low" | "Medium" | "High" {
  const r = (risk || "").toLowerCase();
  if (r === "high" || r === "critical") return "High";
  if (r === "medium") return "Medium";
  return "Low";
}

function deriveStatus(row: DBAssignment): Status {
  if ((row.status || "").toLowerCase() === "completed") {
    return "completed";
  }

  if (!row.due_date) {
    return "on_track";
  }

  const today = new Date();
  const due = new Date(row.due_date);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "due_soon";
  return "on_track";
}

export default function AssignmentsPage() {
  const router = useRouter();

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [assignments, setAssignments] = useState<AssignmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canViewAssignments =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  // Load assignments for the org
  useEffect(() => {
    async function load() {
      // wait for org context
      if (orgLoading) return;

      setLoading(true);
      setError(null);

      if (!organizationId) {
        console.error("Assignments: no organizationId in context");
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
        // 1) Load assignments for this org
        const { data: rows, error: assignError } = await supabase
          .from("staff_competency_assignments")
          .select(
            "id, org_id, staff_id, competency_id, competency_title, competency_risk, due_date, status"
          )
          .eq("org_id", organizationId)
          .order("due_date", { ascending: true });

        if (assignError) {
          console.error("Error loading assignments:", assignError);
          setError("Failed to load assignments. Please try again.");
          setAssignments([]);
          setLoading(false);
          return;
        }

        const dbAssignments = (rows || []) as DBAssignment[];

        if (dbAssignments.length === 0) {
          // No real data yet — keep your nice demo cards
          setAssignments(mockAssignments);
          setLoading(false);
          return;
        }

        // 2) Load staff names for these assignments
        const staffIds = Array.from(
          new Set(dbAssignments.map((a) => a.staff_id).filter(Boolean))
        );

        let staffMap = new Map<string, DBStaff>();

        if (staffIds.length > 0) {
          const { data: staffRows, error: staffError } = await supabase
            .from("staff_members")
            .select("id, full_name")
            .in("id", staffIds);

          if (staffError) {
            console.error("Error loading staff for assignments:", staffError);
          } else {
            (staffRows || []).forEach((s) => {
              staffMap.set(s.id, s as DBStaff);
            });
          }
        }

        // 3) Map DB rows -> UI cards
        const mapped: AssignmentCard[] = dbAssignments.map((row) => {
          const staff = staffMap.get(row.staff_id);

          return {
            id: row.id,
            staffName: staff?.full_name || "Unknown staff",
            competencyTitle: row.competency_title || "Untitled competency",
            facilityName: "Your organization", // TODO: hook up facilities later
            role: "", // TODO: populate from staff later
            discipline: "", // TODO: populate from staff later
            dueDate: row.due_date,
            status: deriveStatus(row),
            risk: normalizeRisk(row.competency_risk),
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

      const haystack = [
        a.staffName,
        a.competencyTitle,
        a.facilityName,
        a.role,
        a.discipline,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [search, statusFilter, assignments]);

  const isLoadingAny = loading || orgLoading;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Assignments</h1>
          <p className="mt-1 text-sm text-slate-400">
            See which staff are assigned to which competencies, and what is
            overdue vs on track.
          </p>
        </div>

        <button
          onClick={() => {
            // Send them to the competency library so they can pick one and assign
            router.push("/dashboard/competencies");
          }}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          New assignment
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status pills */}
        <div className="inline-flex rounded-full border border-slate-800 bg-slate-950 p-1 text-xs">
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
                onClick={() =>
                  setStatusFilter(
                    item.key === "all" ? "all" : (item.key as Status)
                  )
                }
                className={`rounded-full px-3 py-1 ${
                  active
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="w-full max-w-xs">
          <input
            type="text"
            placeholder="Search by staff, competency, facility…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-2">
        {isLoadingAny && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            Loading assignments…
          </div>
        )}

        {!isLoadingAny && error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-6 text-sm text-rose-100">
            {error}
          </div>
        )}

        {!isLoadingAny && !error && filteredAssignments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
            <p className="font-medium text-slate-200">
              No assignments match your filters.
            </p>
            <p className="mt-1">
              Try adjusting the status filter or search, or create a new
              assignment for a staff member.
            </p>
          </div>
        )}

        {!isLoadingAny &&
          !error &&
          filteredAssignments.map((a) => {
            const statusLabel = statusLabels[a.status];

            const statusColor =
              a.status === "overdue"
                ? "text-red-400 bg-red-500/10 border-red-500/40"
                : a.status === "due_soon"
                ? "text-amber-300 bg-amber-500/10 border-amber-500/40"
                : a.status === "on_track"
                ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/40"
                : "text-slate-300 bg-slate-700/20 border-slate-700/60";

            const riskColor =
              a.risk === "High"
                ? "bg-red-500/10 text-red-300 border-red-500/40"
                : a.risk === "Medium"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";

            const dueLabel =
              a.dueDate && !Number.isNaN(new Date(a.dueDate).getTime())
                ? new Date(a.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No due date";

            return (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-50">
                        {a.staffName}
                      </p>
                      {(a.role || a.discipline) && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
                          {[a.role, a.discipline].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-300">
                      {a.competencyTitle}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {a.facilityName}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 ${riskColor}`}
                      >
                        Risk: {a.risk}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      Due{" "}
                      <span className="font-medium text-slate-100">
                        {dueLabel}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-emerald-500/60">
                        View details
                      </button>
                      <button className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-100 hover:border-emerald-500/60">
                        Update status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
