// app/dashboard/library/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCopy,
  Search,
  Users,
  AlertTriangle,
} from "lucide-react";

type Competency = {
  id: string;
  org_id: string;
  title: string | null;
  content: any;
  risk: string | null;
  created_at: string;
  roles?: string[] | null;
  setting?: string | null;
  language?: string | null;
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

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl space-y-6 px-6 py-6",
  grid: "grid gap-6 lg:grid-cols-[1.6fr,1fr]",
  card: "rounded-2xl border border-border bg-card shadow-card p-4",
  cardSoft: "rounded-2xl border border-border bg-card/50 shadow-card p-4",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
  h1: "text-2xl font-semibold tracking-tight text-foreground",
  h2: "text-sm font-semibold text-foreground",
  p: "text-sm text-foreground/80",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
  textarea:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60",
  btnSoft:
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90",
  badge:
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
  msgErr:
    "rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-foreground",
  msgOk:
    "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground",
};

function riskBadgeClasses(risk: string | null | undefined) {
  const r = (risk || "").toLowerCase();
  if (r === "critical") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (r === "high") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  if (r === "medium") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function parseContent(raw: any): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, string>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
      return { content: raw };
    } catch {
      return { content: raw };
    }
  }
  return { content: String(raw) };
}

export default function CompetencyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const competencyId = params?.id as string | undefined;
  const mode = (searchParams?.get("mode") || "").toLowerCase();
  const showAssignPanel = mode === "assign";

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const canAssign =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const [competency, setCompetency] = useState<Competency | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      setLoading(true);
      setError(null);

      if (!competencyId || !organizationId) {
        setError("Unable to load competency.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: comp, error: compError } = await supabase
        .from("competency_templates")
        .select("id, org_id, title, content, risk, created_at, roles, setting, language")
        .eq("id", competencyId)
        .eq("org_id", organizationId)
        .single();

      if (compError || !comp) {
        setError("Competency not found.");
        setLoading(false);
        return;
      }

      setCompetency(comp as Competency);

      if (canAssign && showAssignPanel) {
        const { data: staffRows } = await supabase
          .from("staff_members")
          .select("id, full_name, email")
          .eq("org_id", organizationId)
          .order("full_name");
        setStaff((staffRows as StaffMember[]) || []);
      }

      setLoading(false);
    }

    load();
  }, [competencyId, orgLoading, organizationId, canAssign, showAssignPanel]);

  const sections = useMemo(
    () => parseContent(competency?.content),
    [competency]
  );

  const sectionEntries = useMemo(
    () =>
      Object.entries(sections).filter(
        ([, v]) => typeof v === "string" && v.trim()
      ),
    [sections]
  );

  const staffFiltered = useMemo(() => {
    const q = staffSearch.toLowerCase();
    return staff.filter(
      (s) =>
        `${s.full_name || ""} ${s.email || ""}`.toLowerCase().includes(q)
    );
  }, [staff, staffSearch]);

  if (loading) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <div className={ui.card}>
            <p className="text-sm text-muted-foreground">Loading competency…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !competency) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <Link href="/dashboard/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to library
          </Link>
          <div className={ui.msgErr}>{error}</div>
        </div>
      </div>
    );
  }

  const tags = [
    ...(competency.roles || []),
    competency.setting,
    competency.language,
  ].filter(Boolean) as string[];

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/dashboard/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to library
            </Link>
            <h1 className={ui.h1}>{competency.title || "Untitled competency"}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`${ui.badge} ${riskBadgeClasses(competency.risk)}`}>
                Risk: {competency.risk || "Low"}
              </span>
              <span className="text-xs text-muted-foreground">
                Created {fmtDateTime(competency.created_at)}
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-muted px-2 py-1 text-[11px] text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {canAssign && !showAssignPanel && (
              <button
                className={ui.btnPrimary}
                onClick={() =>
                  router.push(`/dashboard/library/${competency.id}?mode=assign`)
                }
              >
                <Users className="h-4 w-4" />
                Assign
              </button>
            )}
            <button className={ui.btnSoft} onClick={() => navigator.clipboard.writeText(JSON.stringify(sections, null, 2))}>
              <ClipboardCopy className="h-4 w-4" />
              Copy all
            </button>
          </div>
        </div>

        <div className={ui.grid}>
          <section className={ui.card}>
            <div className="space-y-4">
              {sectionEntries.map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className={ui.label}>{SECTION_LABELS[key] || key}</span>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => navigator.clipboard.writeText(value)}
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                    {value}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {showAssignPanel && canAssign && (
            <aside className={ui.cardSoft}>
              <div className="space-y-4">
                <div>
                  <h2 className={ui.h2}>Assign to staff</h2>
                  <p className={ui.p}>
                    Select staff, due date, and optional notes.
                  </p>
                </div>

                {assignError && <div className={ui.msgErr}>{assignError}</div>}
                {assignSuccess && <div className={ui.msgOk}>{assignSuccess}</div>}

                <div className="space-y-2">
                  <div className={ui.label}>Staff</div>
                  <input
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search staff…"
                    className={ui.input}
                  />
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {staffFiltered.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted/30"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(s.id)}
                          onChange={() =>
                            setSelectedStaffIds((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((x) => x !== s.id)
                                : [...prev, s.id]
                            )
                          }
                        />
                        <span className="text-sm">{s.full_name || s.email}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={ui.label}>Due date</div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={ui.input}
                  />
                </div>

                <div className="space-y-2">
                  <div className={ui.label}>Manager notes</div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={ui.textarea}
                  />
                </div>

                <button
                  className={ui.btnPrimary}
                  disabled={assigning || selectedStaffIds.length === 0}
                  onClick={async () => {
                    setAssigning(true);
                    setAssignError(null);
                    await supabase.from("staff_competency_assignments").insert(
                      selectedStaffIds.map((id) => ({
                        org_id: organizationId,
                        staff_id: id,
                        competency_id: competency.id,
                        status: "assigned",
                        due_date: dueDate || null,
                        notes: notes || null,
                        assigned_by: userId,
                      }))
                    );
                    setAssigning(false);
                    setAssignSuccess("Competency assigned.");
                    setSelectedStaffIds([]);
                    setDueDate("");
                    setNotes("");
                  }}
                >
                  Assign competency
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
