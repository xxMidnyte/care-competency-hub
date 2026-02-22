// app/dashboard/assignments/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import {
  ArrowLeft,
  ClipboardCopy,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  FileText,
  UserCheck,
} from "lucide-react";

type DBFacility = { id: string; name: string | null };

type DBStaff = {
  id: string;
  full_name: string | null;
  email: string | null;
  auth_user_id: string | null; // needed for "is assigned staff"
  facility_id: string | null;
  facilities?: DBFacility | DBFacility[] | null;
};

type AssignmentRow = {
  id: string;
  org_id: string;
  staff_id: string | null;
  facility_id: string | null;

  status: string | null;
  due_date: string | null;
  assigned_at: string | null;
  completed_at: string | null;

  assigned_by: string | null;
  notes: string | null;

  competency_id: string | null;
  competency_title: string | null;
  competency_risk: string | null;
  competency_content: any;

  // completion workflow fields
  review_acknowledged_at?: string | null;
  quiz_score?: number | null;
  quiz_completed_at?: string | null;
  quiz_answers?: any;
  evidence_type?: string | null;
  evidence_notes?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;

  staff_members?: DBStaff | DBStaff[] | null;
};

function firstOrNull<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function safeParseContent(raw: any): any {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { content: raw };
    }
  }
  return { content: String(raw) };
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function fmtDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

async function copyText(text: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const SECTION_LABELS: Record<string, string> = {
  purpose: "Purpose",
  why: "Why this matters",
  objectives: "Learning objectives",
  equipment: "Required equipment",
  procedure: "Procedure / steps",
  checklist: "Return demo checklist",
  documentation: "Documentation expectations",
  evidence: "Evidence requirements",
  reassignment: "Reassignment / frequency",
  policy: "Policy references",
  quiz: "Quiz",
};

const SECTION_ORDER = [
  "purpose",
  "why",
  "objectives",
  "equipment",
  "procedure",
  "checklist",
  "documentation",
  "evidence",
  "reassignment",
  "policy",
  "quiz",
];

function parseSections(raw: any): Record<string, string> {
  const parsed = safeParseContent(raw);
  if (!parsed) return {};
  if (typeof parsed !== "object") return { content: String(parsed) };

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (k === "meta") continue;
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function extractQuizQuestions(sections: Record<string, string>) {
  const raw = sections.quiz || "";
  const lines = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const qs: string[] = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^\d+\.\s*/, "")
      .replace(/^[\-\•]\s*/, "")
      .trim();
    if (cleaned) qs.push(cleaned);
  }
  return qs;
}

function normalizeRisk(risk: string | null | undefined) {
  const r = (risk || "").toLowerCase();
  if (r === "critical") return "Critical";
  if (r === "high") return "High";
  if (r === "medium") return "Medium";
  return "Low";
}

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl space-y-6 px-6 py-6",
  card: "rounded-2xl border border-border bg-card shadow-card p-4",
  cardSoft: "rounded-2xl border border-border bg-card/50 shadow-card p-4",
  label: "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  h1: "text-2xl font-semibold tracking-tight text-foreground",
  h2: "text-sm font-semibold text-foreground",
  pMuted: "text-sm text-foreground/60",
  chip: "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-foreground/80",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed",
  btnSoft:
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 shadow-card transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  textarea:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  msgErr: "rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-foreground",
  msgWarn: "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground",
  msgOk: "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground",
  tabWrap: "inline-flex rounded-full border border-border bg-muted p-1 text-xs",
  tabBtn:
    "rounded-full px-3 py-1 transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
};

function badgeRiskClasses(risk: string) {
  const r = risk.toLowerCase();
  if (r === "critical") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (r === "high") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  if (r === "medium") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function prettyEvidenceType(v: string | null | undefined) {
  const s = (v || "").trim();
  if (!s) return "";
  const map: Record<string, string> = {
    return_demo_observed: "Return demo observed",
    written_test: "Written test",
    skills_checklist: "Skills checklist",
    in_service: "In-service completed",
    direct_observation: "Direct observation",
    other: "Other",
  };
  return map[s] || s.replaceAll("_", " ");
}

function isManagerRole(role: string | null | undefined) {
  const r = (role || "").toLowerCase();
  return r === "owner" || r === "admin" || r === "manager" || r === "dev";
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string | undefined;

  const { loading: orgLoading, org } = useOrg();
  const userRole = org?.role ?? "staff";

  // IMPORTANT: manager-level includes dev for your system
  const isManager = isManagerRole(userRole);

  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<AssignmentRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"lesson" | "quiz" | "evidence" | "complete">(
    "lesson"
  );

  const [toast, setToast] = useState<string | null>(null);

  // Evidence / completion fields
  const [evidenceType, setEvidenceType] = useState<string>("");
  const [evidenceNotes, setEvidenceNotes] = useState<string>("");

  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Review / complete
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      setLoading(true);
      setError(null);

      if (!assignmentId) {
        setError("Assignment not found.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: qErr } = await supabase
          .from("staff_competency_assignments")
          .select(
            `
            id,
            org_id,
            staff_id,
            facility_id,
            status,
            due_date,
            assigned_at,
            completed_at,
            assigned_by,
            notes,
            competency_id,
            competency_title,
            competency_content,
            competency_risk,
            review_acknowledged_at,
            quiz_score,
            quiz_completed_at,
            quiz_answers,
            evidence_type,
            evidence_notes,
            verified_by,
            verified_at,
            staff_members:staff_id (
              id,
              full_name,
              email,
              auth_user_id,
              facility_id,
              facilities:facility_id ( id, name )
            )
          `
          )
          .eq("id", assignmentId)
          .single();

        if (qErr || !data) {
          setError("Assignment not found or you don’t have access.");
          setRow(null);
          setLoading(false);
          return;
        }

        const r = data as unknown as AssignmentRow;

        setEvidenceType(r.evidence_type || "");
        setEvidenceNotes(r.evidence_notes || "");

        if (r.quiz_answers && typeof r.quiz_answers === "object") {
          setQuizAnswers(r.quiz_answers as Record<string, string>);
        } else {
          setQuizAnswers({});
        }

        setRow(r);
        setLoading(false);
      } catch (e) {
        console.error("Assignment load crash:", e);
        setError("Unexpected error loading assignment.");
        setRow(null);
        setLoading(false);
      }
    }

    load();
  }, [assignmentId, orgLoading]);

  const staff = useMemo(() => firstOrNull(row?.staff_members), [row]);
  const facility = useMemo(() => firstOrNull(staff?.facilities), [staff]);

  const title = row?.competency_title || "Untitled competency";
  const risk = normalizeRisk(row?.competency_risk);
  const riskCls = badgeRiskClasses(risk);
  const facilityName = facility?.name || "—";
  const staffName = staff?.full_name || staff?.email || "—";

  const isAssignedStaff = !!authUserId && !!staff?.auth_user_id && staff.auth_user_id === authUserId;

  const sections = useMemo(() => parseSections(row?.competency_content), [row?.competency_content]);

  const sectionEntries = useMemo(() => {
    const entries = Object.entries(sections).filter(([, v]) => typeof v === "string" && v.trim());
    const ordered: [string, string][] = [];
    SECTION_ORDER.forEach((k) => {
      const found = entries.find(([key]) => key === k);
      if (found) ordered.push(found as [string, string]);
    });
    const remainder = entries
      .filter(([k]) => !SECTION_ORDER.includes(k))
      .sort(([a], [b]) => a.localeCompare(b));
    return [...ordered, ...(remainder as [string, string][])];
  }, [sections]);

  const quizQuestions = useMemo(() => extractQuizQuestions(sections), [sections]);

  const reviewDone = !!row?.review_acknowledged_at;
  const quizDone = !!row?.quiz_completed_at;
  const evidenceDone = !!(row?.evidence_type || row?.evidence_notes);
  const completed = !!row?.completed_at || (row?.status || "").toLowerCase() === "completed";
  const verified = !!row?.verified_at;

  const canComplete =
    reviewDone && (quizQuestions.length === 0 || quizDone) && (!!evidenceType || !!evidenceNotes);

  // Who can do what
  // Completion actions: assigned staff only (per your UI), and lock after verify
  const canEditCompletion = isAssignedStaff && !verified;
  const canManagerVerify = isManager && completed && !verified;

  async function refreshRow() {
    if (!assignmentId) return;

    const { data, error: qErr } = await supabase
      .from("staff_competency_assignments")
      .select(
        `
        id,
        org_id,
        staff_id,
        facility_id,
        status,
        due_date,
        assigned_at,
        completed_at,
        assigned_by,
        notes,
        competency_id,
        competency_title,
        competency_content,
        competency_risk,
        review_acknowledged_at,
        quiz_score,
        quiz_completed_at,
        quiz_answers,
        evidence_type,
        evidence_notes,
        verified_by,
        verified_at,
        staff_members:staff_id (
          id,
          full_name,
          email,
          auth_user_id,
          facility_id,
          facilities:facility_id ( id, name )
        )
      `
      )
      .eq("id", assignmentId)
      .single();

    if (qErr || !data) return;
    const r = data as unknown as AssignmentRow;

    setEvidenceType(r.evidence_type || "");
    setEvidenceNotes(r.evidence_notes || "");
    if (r.quiz_answers && typeof r.quiz_answers === "object") setQuizAnswers(r.quiz_answers);

    setRow(r);
  }

  async function handleAcknowledgeReview() {
    if (!row) return;

    if (!canEditCompletion) {
      setToast("Not allowed");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("assignment_ack_review", {
      p_assignment_id: row.id,
    });

    setSaving(false);

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message || "Unable to save review acknowledgement.");
      return;
    }

    setToast("Saved ✓");
    await refreshRow();
  }

  async function handleSaveEvidence() {
    if (!row) return;

    if (!canEditCompletion) {
      setToast("Not allowed");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("assignment_save_evidence", {
      p_assignment_id: row.id,
      p_evidence_type: evidenceType || "",
      p_evidence_notes: evidenceNotes || "",
    });

    setSaving(false);

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message || "Unable to save evidence.");
      return;
    }

    setToast("Saved ✓");
    await refreshRow();
  }

  async function handleSubmitQuiz() {
    if (!row) return;

    if (!canEditCompletion) {
      setToast("Not allowed");
      return;
    }

    setQuizSubmitting(true);
    setError(null);

    const answered = Object.values(quizAnswers).filter((v) => (v || "").trim()).length;
    const total = quizQuestions.length || 0;
    const score = total > 0 ? Math.round((answered / total) * 100) : null;

    const { error: rpcErr } = await supabase.rpc("assignment_save_quiz", {
      p_assignment_id: row.id,
      p_quiz_answers: quizAnswers,
      p_quiz_score: score,
    });

    setQuizSubmitting(false);

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message || "Unable to save quiz.");
      return;
    }

    setToast("Quiz saved ✓");
    await refreshRow();
  }

  async function handleMarkComplete() {
    if (!row) return;

    if (!canEditCompletion) {
      setToast("Not allowed");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("assignment_mark_complete", {
      p_assignment_id: row.id,
    });

    setSaving(false);

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message || "Unable to mark complete.");
      return;
    }

    setToast("Completed ✓");
    await refreshRow();
  }

  async function handleVerify() {
    if (!row) return;

    if (!isManager) {
      setToast("Not allowed");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("assignment_verify", {
      p_assignment_id: row.id,
    });

    setSaving(false);

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message || "Unable to verify.");
      return;
    }

    setToast("Verified ✓");
    await refreshRow();
  }

  if (loading) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <div className={ui.card}>
            <p className={ui.pMuted}>Loading assignment…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <Link
            href="/dashboard/assignments"
            className="inline-flex items-center gap-2 text-sm text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assignments
          </Link>

          <div className={ui.msgErr}>{error || "Assignment not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Link
              href="/dashboard/assignments"
              className="inline-flex items-center gap-2 text-sm text-foreground/70"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to assignments
            </Link>

            <h1 className={ui.h1}>{title}</h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`${ui.chip} border ${riskCls}`}>Risk: {risk}</span>
              <span className={ui.chip}>Staff: {staffName}</span>
              <span className={ui.chip}>Facility: {facilityName}</span>
              <span className={ui.chip}>
                Due: {row.due_date ? fmtDateOnly(row.due_date) : "No due date"}
              </span>
              <span className={ui.chip}>Status: {(row.status || "assigned").toLowerCase()}</span>
            </div>

            <div className="text-[12px] text-foreground/60">
              Assigned: {fmtDate(row.assigned_at)} · Completed: {fmtDate(row.completed_at)} · Verified:{" "}
              {fmtDate(row.verified_at)}
            </div>

            {!isAssignedStaff && !isManager && (
              <div className={ui.msgWarn}>
                You can view this assignment, but you’re not the assigned staff member—completion actions are disabled.
              </div>
            )}

            {verified && isAssignedStaff && (
              <div className={ui.msgWarn}>
                This assignment has been verified by a manager. Completion edits are locked.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              className={ui.btnSoft}
              onClick={async () => {
                const ok = await copyText(JSON.stringify(sections, null, 2));
                setToast(ok ? "Copied ✓" : "Copy failed");
              }}
              title="Copy competency snapshot JSON"
              type="button"
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy all
            </button>

            {canManagerVerify && (
              <button className={ui.btnPrimary} onClick={handleVerify} disabled={saving} type="button">
                <ShieldCheck className="h-4 w-4" />
                Verify
              </button>
            )}
          </div>
        </div>

        {toast && <div className={ui.msgOk}>{toast}</div>}
        {error && <div className={ui.msgErr}>{error}</div>}

        {/* Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={ui.tabWrap}>
            {[
              { key: "lesson", label: "Lesson", icon: <BookOpen className="h-4 w-4" /> },
              { key: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" /> },
              { key: "evidence", label: "Evidence", icon: <FileText className="h-4 w-4" /> },
              { key: "complete", label: "Complete", icon: <CheckCircle2 className="h-4 w-4" /> },
            ].map((t) => {
              const active = activeTab === (t.key as any);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  className={`${ui.tabBtn} ${
                    active ? "bg-card text-foreground shadow-sm" : "text-foreground/60 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {t.icon}
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={ui.chip}>Review: {reviewDone ? "✓" : "—"}</span>
            <span className={ui.chip}>Quiz: {quizQuestions.length === 0 ? "N/A" : quizDone ? "✓" : "—"}</span>
            <span className={ui.chip}>Evidence: {evidenceDone ? "✓" : "—"}</span>
            <span className={ui.chip}>Complete: {completed ? "✓" : "—"}</span>
            <span className={ui.chip}>Verified: {verified ? "✓" : "—"}</span>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          {/* Main */}
          <section className={ui.card}>
            {activeTab === "lesson" && (
              <div className="space-y-4">
                <div>
                  <div className={ui.label}>Lesson / competency content</div>
                  <p className={ui.pMuted}>This is the snapshot attached to the assignment (what they are actually completing).</p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className={ui.h2}>Acknowledge review</div>
                    {reviewDone ? (
                      <span className="text-sm text-emerald-300">✓ Reviewed</span>
                    ) : (
                      <span className="text-sm text-foreground/60">Not yet</span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-foreground/70">
                    Staff confirms they reviewed the competency content before taking the quiz or submitting evidence.
                  </p>

                  <div className="mt-3">
                    <button
                      className={ui.btnPrimary}
                      onClick={handleAcknowledgeReview}
                      disabled={saving || reviewDone || !canEditCompletion}
                      title={!canEditCompletion ? "Only the assigned staff member can acknowledge review." : undefined}
                      type="button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {reviewDone ? "Reviewed" : "I reviewed this competency"}
                    </button>
                  </div>
                </div>

                {sectionEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
                    <p className="text-sm font-semibold text-foreground">No content in snapshot.</p>
                    <p className="mt-1 text-sm text-foreground/60">This assignment doesn’t have competency content saved yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sectionEntries.map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className={ui.label}>{SECTION_LABELS[key] || key}</span>
                          <button
                            type="button"
                            className="text-xs text-foreground/60 hover:text-foreground"
                            onClick={async () => {
                              const ok = await copyText(value);
                              setToast(ok ? "Copied ✓" : "Copy failed");
                            }}
                            title="Copy section"
                          >
                            Copy
                          </button>
                        </div>

                        <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{value}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="space-y-4">
                <div>
                  <div className={ui.label}>Quiz</div>
                  <p className={ui.pMuted}>Quick completion quiz. (Upgrade later to graded.)</p>
                </div>

                {quizQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
                    <p className="text-sm font-semibold text-foreground">No quiz found in this competency.</p>
                    <p className="mt-1 text-sm text-foreground/60">
                      If you want a quiz, add a <code className="px-1">quiz</code> section to the competency snapshot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizQuestions.map((q, idx) => {
                      const key = String(idx + 1);
                      return (
                        <div key={key} className="rounded-2xl border border-border bg-muted/30 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className={ui.label}>Question {idx + 1}</div>
                              <div className="mt-1 text-sm text-foreground/80">{q}</div>
                            </div>
                            <button
                              type="button"
                              className="text-xs text-foreground/60 hover:text-foreground"
                              onClick={async () => {
                                const ok = await copyText(q);
                                setToast(ok ? "Copied ✓" : "Copy failed");
                              }}
                            >
                              Copy
                            </button>
                          </div>

                          <div className="mt-3 space-y-1">
                            <div className={ui.label}>Answer</div>
                            <textarea
                              rows={3}
                              value={quizAnswers[key] || ""}
                              onChange={(e) => setQuizAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                              className={ui.textarea}
                              placeholder="Type your answer…"
                              disabled={quizSubmitting || completed || !canEditCompletion}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2">
                      <button
                        className={ui.btnPrimary}
                        onClick={handleSubmitQuiz}
                        disabled={quizSubmitting || completed || !canEditCompletion}
                        title={!canEditCompletion ? "Only the assigned staff member can submit the quiz." : undefined}
                        type="button"
                      >
                        <HelpCircle className="h-4 w-4" />
                        {quizSubmitting ? "Saving…" : quizDone ? "Save quiz again" : "Submit quiz"}
                      </button>

                      {row.quiz_score != null && <span className={ui.chip}>Score: {row.quiz_score}%</span>}
                      {row.quiz_completed_at && <span className={ui.chip}>Submitted: {fmtDate(row.quiz_completed_at)}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "evidence" && (
              <div className="space-y-4">
                <div>
                  <div className={ui.label}>Evidence</div>
                  <p className={ui.pMuted}>This is what makes it survey-proof: how did they prove competency?</p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="space-y-1">
                    <div className={ui.label}>Evidence type</div>
                    <select
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value)}
                      className={ui.input}
                      disabled={saving || completed || !canEditCompletion}
                    >
                      <option value="">Select…</option>
                      <option value="return_demo_observed">Return demo observed</option>
                      <option value="written_test">Written test</option>
                      <option value="skills_checklist">Skills checklist</option>
                      <option value="in_service">In-service completed</option>
                      <option value="direct_observation">Direct observation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className={ui.label}>Evidence notes</div>
                    <textarea
                      rows={4}
                      value={evidenceNotes}
                      onChange={(e) => setEvidenceNotes(e.target.value)}
                      className={ui.textarea}
                      placeholder="Who observed it? Where? Any notes?"
                      disabled={saving || completed || !canEditCompletion}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={ui.btnPrimary}
                      onClick={handleSaveEvidence}
                      disabled={saving || completed || !canEditCompletion}
                      title={!canEditCompletion ? "Only the assigned staff member can save evidence." : undefined}
                      type="button"
                    >
                      <FileText className="h-4 w-4" />
                      Save evidence
                    </button>

                    {(row.evidence_type || row.evidence_notes) && <span className={ui.chip}>Saved ✓</span>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "complete" && (
              <div className="space-y-4">
                <div>
                  <div className={ui.label}>Completion</div>
                  <p className={ui.pMuted}>Complete requires: review acknowledged + quiz (if present) + evidence.</p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={ui.chip}>Review: {reviewDone ? "✓" : "—"}</span>
                    <span className={ui.chip}>Quiz: {quizQuestions.length === 0 ? "N/A" : quizDone ? "✓" : "—"}</span>
                    <span className={ui.chip}>Evidence: {evidenceDone ? "✓" : "—"}</span>
                  </div>

                  {!canComplete && !completed && (
                    <div className={ui.msgWarn}>Finish the required steps first: review + quiz (if any) + evidence.</div>
                  )}

                  {completed ? (
                    <div className={ui.msgOk}>
                      <span className="font-semibold">Completed</span> at {fmtDate(row.completed_at)}.
                      {(row.evidence_type || row.evidence_notes) && (
                        <div className="mt-2 text-sm text-foreground/80">
                          Evidence: <span className="font-medium">{prettyEvidenceType(row.evidence_type)}</span>
                          {row.evidence_notes ? ` · ${row.evidence_notes}` : ""}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className={ui.btnPrimary}
                      onClick={handleMarkComplete}
                      disabled={saving || !canComplete || !canEditCompletion}
                      title={
                        !canEditCompletion
                          ? "Only the assigned staff member can complete the assignment."
                          : !canComplete
                          ? "Complete review, quiz (if present), and evidence first"
                          : "Mark complete"
                      }
                      type="button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? "Saving…" : "Mark complete"}
                    </button>
                  )}

                  {isManager && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div>
                        <div className={ui.label}>Manager verification</div>
                        <p className="mt-1 text-sm text-foreground/60">Optional final sign-off for survey proof.</p>
                      </div>

                      {verified ? (
                        <div className={ui.msgOk}>Verified at {fmtDate(row.verified_at)}.</div>
                      ) : (
                        <button
                          className={ui.btnSoft}
                          onClick={handleVerify}
                          disabled={saving || !completed}
                          title={!completed ? "Must be completed before verifying" : "Verify completion"}
                          type="button"
                        >
                          <UserCheck className="h-4 w-4" />
                          Verify
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Side panel */}
          <aside className={ui.cardSoft}>
            <div className="space-y-4">
              <div>
                <div className={ui.label}>At a glance</div>
                <h2 className="mt-1 text-base font-semibold text-foreground">Assignment checklist</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm">Reviewed</span>
                  </div>
                  <span className={`text-sm ${reviewDone ? "text-emerald-300" : "text-foreground/50"}`}>
                    {reviewDone ? "✓" : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm">Quiz</span>
                  </div>
                  <span
                    className={`text-sm ${
                      quizQuestions.length === 0 || quizDone ? "text-emerald-300" : "text-foreground/50"
                    }`}
                  >
                    {quizQuestions.length === 0 ? "N/A" : quizDone ? "✓" : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm">Evidence</span>
                  </div>
                  <span className={`text-sm ${evidenceDone ? "text-emerald-300" : "text-foreground/50"}`}>
                    {evidenceDone ? "✓" : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className={`text-sm ${completed ? "text-emerald-300" : "text-foreground/50"}`}>
                    {completed ? "✓" : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm">Verified</span>
                  </div>
                  <span className={`text-sm ${verified ? "text-emerald-300" : "text-foreground/50"}`}>
                    {verified ? "✓" : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <div className={ui.label}>Permissions</div>
                <div className="mt-2 space-y-1 text-sm text-foreground/70">
                  <div>
                    View:{" "}
                    <span className="font-medium text-foreground">
                      {isAssignedStaff ? "Assigned staff" : isManager ? "Manager" : "Read-only"}
                    </span>
                  </div>
                  <div>
                    Completion edits:{" "}
                    <span className="font-medium text-foreground">{canEditCompletion ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div>
                    Verify:{" "}
                    <span className="font-medium text-foreground">{isManager ? "Allowed" : "Not allowed"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <div className={ui.label}>What’s next</div>
                <p className="mt-1 text-sm text-foreground/70">
                  This page is the “proof trail” for surveys: what was assigned, what evidence was collected, and when it was completed.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className={ui.btnSoft} onClick={() => router.push("/dashboard/assignments")} type="button">
                  Back
                </button>
                <button
                  className={ui.btnSoft}
                  type="button"
                  onClick={async () => {
                    const summary = {
                      assignment_id: row.id,
                      staff: staffName,
                      staff_id: row.staff_id,
                      staff_auth_user_id: staff?.auth_user_id ?? null,
                      facility: facilityName,
                      competency_title: title,
                      due_date: row.due_date,
                      status: row.status,
                      completed_at: row.completed_at,
                      verified_at: row.verified_at,
                      review_acknowledged_at: row.review_acknowledged_at,
                      quiz_completed_at: row.quiz_completed_at,
                      quiz_score: row.quiz_score,
                      evidence_type: row.evidence_type,
                      evidence_notes: row.evidence_notes,
                    };
                    const ok = await copyText(JSON.stringify(summary, null, 2));
                    setToast(ok ? "Copied ✓" : "Copy failed");
                  }}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copy summary
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
