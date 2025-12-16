// app/dashboard/deficiencies/[deficiencyId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Deficiency = {
  id: string;
  org_id: string;
  facility_id: string | null;
  title: string | null;
  tag_code: string | null;
  deficiency_text: string;
  severity: string | null;
  scope: string | null;
  survey_date: string | null;
  status: string;
};

type POC = {
  id: string;
  deficiency_id: string;
  immediate_actions: string | null;
  correction_steps: string | null;
  monitoring_plan: string | null;
  completion_date: string | null;
  responsible_roles: string | null;
  policy_updates: string | null;
  education_plan: string | null;
  documentation_plan: string | null;
  status: string;
};

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-5xl space-y-6 px-6 py-8",
  card: "rounded-2xl border border-border bg-card shadow-card",
  cardSoft: "rounded-2xl border border-border bg-muted/30 shadow-card",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  h1: "text-xl font-semibold tracking-tight",
  h2: "text-sm font-semibold",
  p: "text-sm text-foreground/60",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  textarea:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  btnPrimary:
    "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnSoft:
    "inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-card transition hover:opacity-90",
  msgErr:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground",
  msgOk:
    "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-foreground",
};

function fmtDate(value: string | null | undefined) {
  if (!value) return "N/A";
  // If it's already YYYY-MM-DD, keep it. If ISO, take date part.
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export default function DeficiencyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deficiencyId = params?.deficiencyId as string;

  // ---- ORG / PERMS ----
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasDefModule = org?.featureFlags?.has_deficiency_module ?? false;
  const hasModuleAccess = isDevOrg || hasDefModule;

  const canEditPoc =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  // ---- STATE ----
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [deficiency, setDeficiency] = useState<Deficiency | null>(null);
  const [poc, setPoc] = useState<POC | null>(null);

  const [notes, setNotes] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const actionDisabled = useMemo(() => {
    if (!canEditPoc) return true;
    if (poc) return saving || generating;
    return generating || saving;
  }, [canEditPoc, saving, generating, poc]);

  // ---- LOAD DEFICIENCY + POC ----
  useEffect(() => {
    if (orgLoading || !deficiencyId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!organizationId || !org) {
          setError("Unable to load your organization.");
          return;
        }

        if (!hasModuleAccess) {
          setError("The deficiency module is not enabled for your organization.");
          return;
        }

        // Deficiency scoped to org
        const { data: def, error: defError } = await supabase
          .from("survey_deficiencies")
          .select("*")
          .eq("id", deficiencyId)
          .eq("org_id", organizationId)
          .single();

        if (defError || !def) {
          console.error("Deficiency load error:", defError);
          setError("Unable to load deficiency.");
          return;
        }

        setDeficiency(def as Deficiency);

        // Latest POC (if any)
        const { data: pocData, error: pocError } = await supabase
          .from("survey_pocs")
          .select("*")
          .eq("deficiency_id", deficiencyId)
          .eq("org_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pocError) {
          // Not fatal
          console.error("POC load error:", pocError);
        }

        if (pocData) setPoc(pocData as POC);
      } catch (err) {
        console.error(err);
        setError("Unexpected error loading deficiency.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, org, organizationId, hasModuleAccess, deficiencyId]);

  // ---- COPY HELPER ----
  const handleCopy = async (key: string, text: string) => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      await navigator.clipboard.writeText(text || "");
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1400);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // ---- GENERATE POC (AI) ----
  async function handleGenerate() {
    if (!deficiency || !organizationId) return;

    if (!canEditPoc) {
      setError("You do not have permission to generate Plans of Correction.");
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/poc/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deficiencyId: deficiency.id,
          orgId: organizationId,
          facilityId: deficiency.facility_id,
          customNotes: notes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || "Failed to generate plan of correction.");
        return;
      }

      setPoc(json.poc);
      setSuccess("Plan of Correction generated. Review and edit before submitting.");
    } catch (err) {
      console.error(err);
      setError("Unexpected error generating POC.");
    } finally {
      setGenerating(false);
    }
  }

  // ---- SAVE POC ----
  async function handleSave() {
    if (!poc || !organizationId) return;

    if (!canEditPoc) {
      setError("You do not have permission to edit Plans of Correction.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("survey_pocs")
        .update({
          immediate_actions: poc.immediate_actions,
          correction_steps: poc.correction_steps,
          monitoring_plan: poc.monitoring_plan,
          completion_date: poc.completion_date,
          responsible_roles: poc.responsible_roles,
          policy_updates: poc.policy_updates,
          education_plan: poc.education_plan,
          documentation_plan: poc.documentation_plan,
          status: poc.status ?? "draft",
        })
        .eq("id", poc.id)
        .eq("org_id", organizationId);

      if (updateError) {
        console.error(updateError);
        setError("Failed to save changes.");
        return;
      }

      setSuccess("Plan of Correction saved.");
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving.");
    } finally {
      setSaving(false);
    }
  }

  // ---- LOADING / HARD ERRORS ----
  if (loading) {
    return (
      <div className={ui.page}>
        <div className="p-6 text-sm text-foreground/60">Loading deficiency…</div>
      </div>
    );
  }

  if (error && (!hasModuleAccess || !organizationId)) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <div className={`${ui.card} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={ui.label}>Survey & POCs</div>
                <h1 className="mt-1 text-lg font-semibold">Survey deficiency</h1>
              </div>
              <button className={ui.btnSoft} onClick={() => router.push("/dashboard/deficiencies")}>
                Back
              </button>
            </div>
            <div className={`mt-4 ${ui.msgErr}`}>
              <p className="font-semibold text-red-500">Access blocked</p>
              <p className="mt-1 text-xs text-foreground/80">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deficiency) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <div className={`${ui.card} p-5`}>
            <h1 className="text-lg font-semibold">Deficiency not found</h1>
            <p className="mt-1 text-sm text-foreground/60">
              We couldn&apos;t find that survey deficiency in your organization.
            </p>
            <div className="mt-4">
              <button
                className={ui.btnSoft}
                onClick={() => router.push("/dashboard/deficiencies")}
              >
                Back to deficiencies
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN UI ----
  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className={ui.label}>Survey deficiency</div>
            <h1 className={`${ui.h1} mt-1 truncate`}>
              {deficiency.tag_code ? `${deficiency.tag_code} · ` : ""}
              {deficiency.title || "Survey deficiency"}
            </h1>
            <p className="mt-1 text-sm text-foreground/60">
              Severity: <span className="text-foreground/80">{deficiency.severity || "N/A"}</span>{" "}
              · Scope: <span className="text-foreground/80">{deficiency.scope || "N/A"}</span>{" "}
              · Survey date: <span className="text-foreground/80">{fmtDate(deficiency.survey_date)}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {!canEditPoc && (
              <p className="max-w-sm text-[11px] text-foreground/60 sm:text-right">
                View-only. Managers/admins can generate and edit the Plan of Correction.
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/deficiencies")}
                className={ui.btnSoft}
              >
                Back
              </button>

              <button
                type="button"
                onClick={poc ? handleSave : handleGenerate}
                disabled={actionDisabled}
                className={ui.btnPrimary}
              >
                {poc
                  ? saving
                    ? "Saving…"
                    : "Save Plan of Correction"
                  : generating
                  ? "Generating…"
                  : "Generate Plan of Correction"}
              </button>
            </div>
          </div>
        </div>

        {/* STATUS MESSAGES */}
        {success && (
          <div className={ui.msgOk}>
            <p className="font-semibold text-emerald-500">Saved</p>
            <p className="mt-1 text-xs text-foreground/80">{success}</p>
          </div>
        )}
        {error && (
          <div className={ui.msgErr}>
            <p className="font-semibold text-red-500">Action needed</p>
            <p className="mt-1 text-xs text-foreground/80">{error}</p>
          </div>
        )}

        {/* DEFICIENCY TEXT */}
        <section className={`${ui.card} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={ui.h2}>Deficiency details</h2>
              <p className="mt-1 text-xs text-foreground/60">
                Copy/paste-ready for your internal notes and documentation.
              </p>
            </div>

            <button
              type="button"
              className={ui.btnSoft}
              onClick={() => handleCopy("deficiency_text", deficiency.deficiency_text || "")}
            >
              {copiedKey === "deficiency_text" ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/80">
            {deficiency.deficiency_text}
          </p>
        </section>

        {/* NOTES FOR AI (only before POC exists) */}
        {!poc && (
          <section className={`${ui.cardSoft} p-5`}>
            <h2 className={ui.h2}>Optional: add context for AI</h2>
            <p className="mt-1 text-xs text-foreground/60">
              Example: what you already did, staffing context, resident mix, existing policies, or
              anything you want reflected in the Plan of Correction.
            </p>

            <textarea
              className={`${ui.textarea} mt-4`}
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes you want to include in the AI-generated plan..."
              disabled={!canEditPoc}
            />

            {!canEditPoc && (
              <p className="mt-2 text-[11px] text-foreground/60">
                Only managers/admins can generate a Plan of Correction.
              </p>
            )}
          </section>
        )}

        {/* POC EDITOR */}
        {poc && (
          <section className={`${ui.card} p-5`}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={ui.h2}>Plan of Correction</h2>
                <p className="mt-1 text-xs text-foreground/60">
                  Edit sections below. Use “Copy” to paste into surveyor forms or internal docs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-muted/30 px-2 py-1 text-[11px] font-semibold text-foreground/70">
                  Status: {poc.status || "draft"}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <POCField
                label="1) Immediate actions taken"
                value={poc.immediate_actions || ""}
                onChange={(v) => setPoc({ ...poc, immediate_actions: v })}
                copyKey="immediate_actions"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={!canEditPoc}
              />

              <POCField
                label="2) How the deficiency will be corrected"
                value={poc.correction_steps || ""}
                onChange={(v) => setPoc({ ...poc, correction_steps: v })}
                copyKey="correction_steps"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={!canEditPoc}
              />

              <POCField
                label="3) Monitoring / QA plan"
                value={poc.monitoring_plan || ""}
                onChange={(v) => setPoc({ ...poc, monitoring_plan: v })}
                copyKey="monitoring_plan"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={!canEditPoc}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={ui.label}>Completion date</label>
                  <input
                    type="date"
                    className={ui.input}
                    value={poc.completion_date || ""}
                    onChange={(e) =>
                      setPoc({ ...poc, completion_date: e.target.value || null })
                    }
                    disabled={!canEditPoc}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className={ui.label}>Responsible roles</label>
                    <button
                      type="button"
                      onClick={() => handleCopy("responsible_roles", poc.responsible_roles || "")}
                      className={ui.btnSoft}
                    >
                      {copiedKey === "responsible_roles" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <textarea
                    className={ui.textarea}
                    rows={3}
                    value={poc.responsible_roles || ""}
                    onChange={(e) => setPoc({ ...poc, responsible_roles: e.target.value })}
                    disabled={!canEditPoc}
                  />
                </div>
              </div>

              <POCField
                label="Policy updates"
                value={poc.policy_updates || ""}
                onChange={(v) => setPoc({ ...poc, policy_updates: v })}
                copyKey="policy_updates"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={!canEditPoc}
              />

              <POCField
                label="Education / in-services / competencies"
                value={poc.education_plan || ""}
                onChange={(v) => setPoc({ ...poc, education_plan: v })}
                copyKey="education_plan"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={!canEditPoc}
              />

              <POCField
                label="Documentation / proof plan"
                value={poc.documentation_plan || ""}
                onChange={(v) => setPoc({ ...poc, documentation_plan: v })}
                copyKey="documentation_plan"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={!canEditPoc}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

type POCFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  disabled?: boolean;
};

function POCField({
  label,
  value,
  onChange,
  copyKey,
  copiedKey,
  onCopy,
  disabled,
}: POCFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-foreground/70">
          {label}
        </label>
        <button
          type="button"
          onClick={() => onCopy(copyKey, value)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-card transition hover:opacity-90"
        >
          {copiedKey === copyKey ? "Copied!" : "Copy"}
        </button>
      </div>

      <textarea
        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent disabled:opacity-70"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
