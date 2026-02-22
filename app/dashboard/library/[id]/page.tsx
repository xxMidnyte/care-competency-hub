// app/dashboard/library/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import { ArrowLeft, ClipboardCopy, Users } from "lucide-react";

const LIBRARY_ORG_ID = "00000000-0000-0000-0000-000000000001";

type Competency = {
  id: string;
  org_id: string | null;
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
  why: "Why this matters",
  objectives: "Learning objectives",
  equipment: "Required equipment",
  procedure: "Procedure / steps",
  checklist: "Return demo checklist",
  quiz: "Quiz questions",
  policy: "Policy references",
  documentation: "Documentation expectations",
  evidence: "Evidence requirements",
  reassignment: "Reassignment / frequency",
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

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl space-y-6 px-6 py-6",
  grid: "grid gap-6 lg:grid-cols-[1.65fr,1fr]",
  card: "rounded-2xl border border-border bg-card shadow-card p-4",
  cardSoft: "rounded-2xl border border-border bg-card/50 shadow-card p-4",
  label: "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
  h1: "text-2xl font-semibold tracking-tight text-foreground",
  h2: "text-sm font-semibold text-foreground",
  p: "text-sm text-foreground/80",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
  textarea:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnSoft:
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  badge: "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
  chip: "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-foreground/80",
  msgErr: "rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-foreground",
  msgOk: "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground",
};

function riskBadgeClasses(risk: string | null | undefined) {
  const r = (risk || "").toLowerCase();
  if (r === "critical") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (r === "high") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  if (r === "medium") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function sourceBadgeClasses(source: "CCH Library" | "Your org") {
  return source === "CCH Library"
    ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
    : "border-primary/30 bg-primary/10 text-primary";
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
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

function firstLine(s: string, max = 54) {
  const line = (s || "").split("\n")[0].trim();
  if (!line) return "";
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

type Meta = {
  tier?: string | null;
  evidence?: string | null;
  reassignment?: string | null;
};

function extractMeta(rawContent: any): Meta {
  const c = safeParseContent(rawContent) || {};
  const meta = c?.meta && typeof c.meta === "object" ? c.meta : {};

  const tier = meta.tier ?? c.tier ?? c.category ?? c.level ?? null;

  const evidence =
    meta.evidence ??
    meta.evidence_requirements ??
    c.evidence ??
    c["evidence requirements"] ??
    c.evidence_requirements ??
    c.evidenceRequirements ??
    null;

  const reassignment =
    meta.reassignment ??
    meta.reassign ??
    meta.frequency ??
    meta.interval ??
    c.reassignment ??
    c.reassign ??
    c.frequency ??
    c.interval ??
    c.reassignment_interval ??
    c.reassignmentInterval ??
    null;

  return {
    tier: tier ? String(tier) : null,
    evidence: evidence ? String(evidence) : null,
    reassignment: reassignment ? String(reassignment) : null,
  };
}

function parseContent(raw: any): Record<string, string> {
  const parsed = safeParseContent(raw);
  if (!parsed) return {};
  if (typeof parsed === "object") return parsed as Record<string, string>;
  return { content: String(parsed) };
}

/** Supabase errors often console as {} — this forces the useful fields out */
function debugSupabaseError(label: string, err: any) {
  if (!err) return { label, err: null };

  const dump = {
    label,
    type: typeof err,
    name: err?.name,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    code: err?.code,
    status: err?.status,
    statusText: err?.statusText,
    stack: err?.stack,
    keys: err ? Object.keys(err) : [],
    ownProps: err ? Object.getOwnPropertyNames(err) : [],
    string: String(err),
    raw: err,
  };

  // eslint-disable-next-line no-console
  console.error(dump);
  return dump;
}

/** Clipboard helper that works even when navigator.clipboard is blocked */
async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
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
  const canAssign = userRole === "dev" || userRole === "admin" || userRole === "manager";

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
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr) debugSupabaseError("auth.getUser failed", authErr);

      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // IMPORTANT: allow viewing:
      // - your org templates
      // - library org templates
      // - (optionally) null org templates if you still have any legacy rows
      const { data: comp, error: compError } = await supabase
        .from("competency_templates")
        .select("id, org_id, title, content, risk, created_at, roles, setting, language")
        .eq("id", competencyId)
        .or(`org_id.eq.${organizationId},org_id.eq.${LIBRARY_ORG_ID},org_id.is.null`)
        .single();

      if (compError || !comp) {
        if (compError) debugSupabaseError("competency_templates select failed", compError);
        setError("Competency not found.");
        setLoading(false);
        return;
      }

      setCompetency(comp as Competency);

      if (canAssign && showAssignPanel) {
        const { data: staffRows, error: staffErr } = await supabase
          .from("staff_members")
          .select("id, full_name, email")
          .eq("org_id", organizationId)
          .order("full_name");

        if (staffErr) {
          debugSupabaseError("staff_members load failed", staffErr);
          setAssignError("Unable to load staff list for assignment.");
          setStaff([]);
        } else {
          setStaff((staffRows as StaffMember[]) || []);
        }
      }

      setLoading(false);
    }

    load();
  }, [competencyId, orgLoading, organizationId, canAssign, showAssignPanel]);

  const source: "CCH Library" | "Your org" =
    competency?.org_id === LIBRARY_ORG_ID || competency?.org_id === null ? "CCH Library" : "Your org";

  const sections = useMemo(() => parseContent(competency?.content), [competency]);
  const meta = useMemo(() => extractMeta(competency?.content), [competency]);

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

  const staffFiltered = useMemo(() => {
    const q = staffSearch.toLowerCase().trim();
    if (!q) return staff;
    return staff.filter((s) => `${s.full_name || ""} ${s.email || ""}`.toLowerCase().includes(q));
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

  const tags = [...(competency.roles || []), competency.setting, competency.language].filter(Boolean) as string[];

  const tierLabel = meta.tier ? firstLine(meta.tier, 48) : "—";
  const evidenceLabel = meta.evidence ? firstLine(meta.evidence, 48) : "—";
  const reassignmentLabel = meta.reassignment ? firstLine(meta.reassignment, 48) : "—";

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Link href="/dashboard/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to library
            </Link>

            <h1 className={ui.h1}>{competency.title || "Untitled competency"}</h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`${ui.badge} ${sourceBadgeClasses(source)}`}>{source}</span>
              <span className={`${ui.badge} ${riskBadgeClasses(competency.risk)}`}>Risk: {competency.risk || "Low"}</span>
              <span className="text-xs text-muted-foreground">Created {fmtDate(competency.created_at)}</span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className={ui.chip}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            {canAssign && !showAssignPanel && (
              <button className={ui.btnPrimary} onClick={() => router.push(`/dashboard/library/${competency.id}?mode=assign`)}>
                <Users className="h-4 w-4" />
                Assign
              </button>
            )}

            <button
              className={ui.btnSoft}
              onClick={async () => {
                const ok = await copyText(JSON.stringify(sections, null, 2));
                if (!ok) setError("Copy failed. Your browser blocked clipboard access.");
              }}
              title="Copies the full competency JSON/text to clipboard"
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy all
            </button>
          </div>
        </div>

        {/* CONTENT + SIDE */}
        <div className={ui.grid}>
          {/* LEFT: Preview */}
          <section className={ui.card}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={ui.label}>Preview</div>
                <p className="mt-1 text-sm text-foreground/60">Read-only view for review and survey readiness.</p>
              </div>

              {showAssignPanel && (
                <Link href={`/dashboard/library/${competency.id}`} className={ui.btnSoft}>
                  Exit assign
                </Link>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {sectionEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
                  <p className="text-sm font-semibold text-foreground">No content yet.</p>
                  <p className="mt-1 text-sm text-foreground/60">This competency doesn’t have any sections populated.</p>
                </div>
              ) : (
                sectionEntries.map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className={ui.label}>{SECTION_LABELS[key] || key}</span>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={async () => {
                          const ok = await copyText(value);
                          if (!ok) setError("Copy failed. Your browser blocked clipboard access.");
                        }}
                        title="Copy section"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{value}</pre>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* RIGHT: At a glance OR Assign */}
          {!showAssignPanel && (
            <aside className={ui.cardSoft}>
              <div className="space-y-4">
                <div>
                  <h2 className={ui.h2}>At a glance</h2>
                  <p className="text-sm text-foreground/60">The three things admins care about when deciding to use it.</p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                  <div>
                    <div className={ui.label}>Tier</div>
                    <div className="mt-1 text-sm text-foreground/80">{tierLabel}</div>
                  </div>
                  <div>
                    <div className={ui.label}>Evidence</div>
                    <div className="mt-1 text-sm text-foreground/80">{evidenceLabel}</div>
                  </div>
                  <div>
                    <div className={ui.label}>Reassignment</div>
                    <div className="mt-1 text-sm text-foreground/80">{reassignmentLabel}</div>
                  </div>
                </div>

                {canAssign && (
                  <button className={ui.btnPrimary} onClick={() => router.push(`/dashboard/library/${competency.id}?mode=assign`)}>
                    <Users className="h-4 w-4" />
                    Use / assign
                  </button>
                )}
              </div>
            </aside>
          )}

          {showAssignPanel && canAssign && (
            <aside className={ui.cardSoft}>
              <div className="space-y-4">
                <div>
                  <h2 className={ui.h2}>Assign to staff</h2>
                  <p className={ui.p}>Select staff, due date, and optional notes.</p>

                  {source === "CCH Library" && (
                    <div className="mt-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-foreground">
                      You’re assigning a <span className="font-semibold">CCH Library</span> template.
                    </div>
                  )}
                </div>

                {assignError && <div className={ui.msgErr}>{assignError}</div>}
                {assignSuccess && <div className={ui.msgOk}>{assignSuccess}</div>}

                <div className="space-y-2">
                  <div className={ui.label}>Staff</div>
                  <input value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} placeholder="Search staff…" className={ui.input} />

                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {staffFiltered.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted/30">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(s.id)}
                          onChange={() =>
                            setSelectedStaffIds((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))
                          }
                        />
                        <span className="text-sm">{s.full_name || s.email || "Unnamed staff"}</span>
                      </label>
                    ))}

                    {staffFiltered.length === 0 && <p className="text-sm text-muted-foreground">No staff match your search.</p>}
                  </div>

                  {selectedStaffIds.length > 0 && (
                    <p className="text-xs text-foreground/60">
                      Selected <span className="font-semibold text-foreground">{selectedStaffIds.length}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className={ui.label}>Due date</div>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={ui.input} />
                </div>

                <div className="space-y-2">
                  <div className={ui.label}>Manager notes</div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for staff…"
                    className={ui.textarea}
                  />
                </div>

                <button
                  className={ui.btnPrimary}
                  disabled={assigning || selectedStaffIds.length === 0}
                  onClick={async () => {
                    if (!organizationId) return;

                    setAssigning(true);
                    setAssignError(null);
                    setAssignSuccess(null);

                    const payload = selectedStaffIds.map((id) => ({
                      org_id: organizationId,
                      staff_id: id,
                      competency_id: competency.id,
                      status: "assigned",
                      due_date: dueDate || null,
                      notes: notes || null,
                      assigned_by: userId,
                    }));

                    const { error: insErr } = await supabase.from("staff_competency_assignments").insert(payload);

                    setAssigning(false);

                    if (insErr) {
                      debugSupabaseError("Assign insert failed", insErr);
                      setAssignError(insErr?.message || "Unable to assign competency. Please try again.");
                      return;
                    }

                    setAssignSuccess("Competency assigned.");
                    setSelectedStaffIds([]);
                    setDueDate("");
                    setNotes("");
                  }}
                >
                  {assigning ? "Assigning…" : "Assign competency"}
                </button>
              </div>
            </aside>
          )}

          {showAssignPanel && !canAssign && (
            <aside className={ui.cardSoft}>
              <div className="space-y-3">
                <h2 className={ui.h2}>Assign to staff</h2>
                <p className="text-sm text-foreground/60">You don’t have permission to assign competencies.</p>
                <Link href={`/dashboard/library/${competency.id}`} className={ui.btnSoft}>
                  Back to preview
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
