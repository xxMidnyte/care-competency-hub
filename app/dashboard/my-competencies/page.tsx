"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
} from "lucide-react";

/* ----------------------------- Types ----------------------------- */

type StaffSelf = {
  id: string;
  full_name: string | null;
  email: string | null;
  org_id: string;
  facility_id: string | null;
};

type DBAssignment = {
  id: string;
  org_id: string;
  staff_id: string;
  competency_id: string;
  due_date: string | null; // timestamptz
  status: string | null;   // assigned | completed | etc
  completed_at: string | null;
};

type DBCompetency = {
  id: string;
  title: string | null;
  risk_level: string | null;
  risk: string | null;
};

type Row = {
  a: DBAssignment;
  c: DBCompetency | null;
};

type StatusFilter =
  | "all"
  | "assigned"
  | "completed"
  | "overdue"
  | "due_soon";

/* ----------------------------- UI ----------------------------- */

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl space-y-6 px-6 py-8",
  card: "rounded-2xl border border-border bg-card shadow-card",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-sm font-semibold",
  p: "text-sm text-foreground/60",
  input:
    "w-full rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]",
  btnPrimary:
    "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-60",
  btnSoft:
    "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-card hover:opacity-90",
  msgErr:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm",
  msgOk:
    "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm",
};

const chipWrap =
  "inline-flex rounded-full border border-border bg-muted p-1 text-xs";
const chipBtn =
  "rounded-full px-3 py-1 transition hover:bg-muted";

/* ----------------------------- Helpers ----------------------------- */

function normalizeRisk(risk: string | null | undefined) {
  const r = (risk || "").toLowerCase();
  if (r === "critical") return "critical";
  if (r === "high") return "high";
  if (r === "medium") return "medium";
  return "low";
}

function riskBadge(risk: string | null | undefined) {
  const r = normalizeRisk(risk);
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold";
  const cls =
    r === "critical"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : r === "high"
      ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
      : r === "medium"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";

  return <span className={`${base} ${cls}`}>Risk: {r}</span>;
}

function toDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function getDueState(due: string | null | undefined) {
  const d0 = toDateOnly(due);
  if (!d0) return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(d0);
  const diff =
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diff < 0) return "overdue";
  if (diff <= 7) return "due_soon";
  return "on_track";
}

function dueBadge(due: string | null | undefined, completed: boolean) {
  if (completed) return null;
  const s = getDueState(due);

  if (s === "overdue") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Overdue
      </span>
    );
  }

  if (s === "due_soon") {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-200">
        <Clock className="mr-1 h-3 w-3" />
        Due soon
      </span>
    );
  }

  return null;
}

/* ----------------------------- Page ----------------------------- */

export default function MyCompetenciesPage() {
  const router = useRouter();
  const { loading: orgLoading, organizationId } = useOrg();

  const [staff, setStaff] = useState<StaffSelf | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  /* ---------- Load staff ---------- */
  useEffect(() => {
    if (orgLoading) return;

    async function loadStaff() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.email) return router.push("/login");

      const { data: staffRow } = await supabase
        .from("staff_members")
        .select("id, full_name, email, org_id, facility_id")
        .eq("org_id", organizationId!)
        .eq("email", data.user.email)
        .maybeSingle();

      setStaff(staffRow || null);
    }

    loadStaff();
  }, [orgLoading, organizationId, router]);

  /* ---------- Load assignments ---------- */
  useEffect(() => {
    if (!staff) return;

    async function load() {
      setLoading(true);

      const { data: assigns } = await supabase
        .from("competency_assignments")
        .select("id, org_id, staff_id, competency_id, due_date, status, completed_at")
        .eq("staff_id", staff.id)
        .order("due_date");

      if (!assigns || assigns.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const ids = [...new Set(assigns.map((a) => a.competency_id))];

      const { data: comps } = await supabase
        .from("competency_templates")
        .select("id, title, risk_level, risk")
        .in("id", ids);

      const map = new Map(comps?.map((c) => [c.id, c]) ?? []);

      setRows(
        assigns.map((a) => ({
          a,
          c: map.get(a.competency_id) ?? null,
        }))
      );

      setLoading(false);
    }

    load();
  }, [staff]);

  /* ---------- Derived ---------- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(({ a, c }) => {
      const completed = a.status === "completed";
      const dueState = getDueState(a.due_date);

      if (filter === "assigned" && completed) return false;
      if (filter === "completed" && !completed) return false;
      if (filter === "overdue" && dueState !== "overdue") return false;
      if (filter === "due_soon" && dueState !== "due_soon") return false;

      return !q || `${c?.title ?? ""}`.toLowerCase().includes(q);
    });
  }, [rows, search, filter]);

  /* ---------- Complete ---------- */
  async function markComplete(id: string) {
    setSaving(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("competency_assignments")
      .update({ status: "completed", completed_at: now })
      .eq("id", id);

    if (!error) {
      setRows((r) =>
        r.map((x) =>
          x.a.id === id ? { ...x, a: { ...x.a, status: "completed", completed_at: now } } : x
        )
      );
      setSuccess("Marked as completed.");
    }

    setSaving(false);
  }

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <div className={`${ui.card} p-5`}>Loading your competencies…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        <h1 className={ui.h1}>My competencies</h1>

        {/* Filters */}
        <div className="flex justify-between">
          <div className={chipWrap}>
            {["all", "assigned", "due_soon", "overdue", "completed"].map((k) => (
              <button
                key={k}
                className={`${chipBtn} ${filter === k ? "bg-card" : ""}`}
                onClick={() => setFilter(k as StatusFilter)}
              >
                {k.replace("_", " ")}
              </button>
            ))}
          </div>

          <input
            className={ui.input}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map(({ a, c }) => {
            const completed = a.status === "completed";
            const risk = c?.risk_level ?? c?.risk;

            return (
              <div key={a.id} className={`${ui.card} p-4`}>
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{c?.title}</div>
                    <div className="mt-1 flex gap-2">
                      {riskBadge(risk)}
                      {dueBadge(a.due_date, completed)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={ui.btnSoft}
                      onClick={() =>
                        router.push(`/dashboard/library/${a.competency_id}`)
                      }
                    >
                      View <ArrowRight className="h-4 w-4" />
                    </button>

                    {!completed && (
                      <button
                        className={ui.btnPrimary}
                        disabled={saving}
                        onClick={() => markComplete(a.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
