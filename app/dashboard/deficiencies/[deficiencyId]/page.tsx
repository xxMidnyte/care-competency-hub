// app/dashboard/deficiencies/[deficiencyId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
          setLoading(false);
          return;
        }

        if (!hasModuleAccess) {
          setError("The deficiency module is not enabled for your organization.");
          setLoading(false);
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
          setLoading(false);
          return;
        }

        setDeficiency(def as Deficiency);

        // Latest POC (if any)
        const { data: pocData } = await supabase
          .from("survey_pocs")
          .select("*")
          .eq("deficiency_id", deficiencyId)
          .eq("org_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pocData) {
          setPoc(pocData as POC);
        }
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
      setTimeout(() => setCopiedKey(null), 1500);
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

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to generate plan of correction.");
        setGenerating(false);
        return;
      }

      setPoc(json.poc);
      setSuccess(
        "Plan of Correction generated. Review and edit before submitting."
      );
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
        setSaving(false);
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
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="p-6 text-sm text-slate-500">Loading deficiency…</div>
      </div>
    );
  }

  if (error && (!hasModuleAccess || !organizationId)) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6 max-w-3xl space-y-3">
          <h1 className="text-xl font-semibold">Survey deficiency</h1>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!deficiency) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6 max-w-3xl space-y-3">
          <h1 className="text-xl font-semibold">Deficiency not found</h1>
          <p className="text-sm text-slate-500">
            We couldn&apos;t find that survey deficiency in your organization.
          </p>
        </div>
      </div>
    );
  }

  // ---- MAIN UI ----
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              {deficiency.tag_code ? `${deficiency.tag_code} · ` : ""}
              {deficiency.title || "Survey deficiency"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Severity: {deficiency.severity || "N/A"} · Scope:{" "}
              {deficiency.scope || "N/A"} · Survey date:{" "}
              {deficiency.survey_date || "N/A"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {!canEditPoc && (
              <p className="text-[11px] text-slate-500 text-right">
                You can view this deficiency, but only managers/admins can edit
                the Plan of Correction.
              </p>
            )}

            <button
              type="button"
              onClick={poc ? handleSave : handleGenerate}
              disabled={generating || saving || !canEditPoc}
              className="inline-flex items-center rounded-md border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {poc
                ? saving
                  ? "Saving..."
                  : "Save Plan of Correction"
                : generating
                ? "Generating..."
                : "Generate Plan of Correction"}
            </button>
          </div>
        </div>

        {/* DEFICIENCY TEXT */}
        <section className="rounded-lg border border-slate-200 bg-[var(--surface-soft)] p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Deficiency details
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--foreground)]/80">
            {deficiency.deficiency_text}
          </p>
        </section>

        {/* NOTES FOR AI (only before POC exists) */}
        {!poc && (
          <section className="rounded-lg border border-slate-200 bg-[var(--surface-soft)] p-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Optional: add context for AI
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Example: what you already did, staffing context, resident mix,
              existing policies, or anything you want reflected in the Plan of
              Correction.
            </p>
            <textarea
              className="mt-3 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes you want to include in the AI-generated plan..."
            />
          </section>
        )}

        {/* STATUS MESSAGES */}
        {success && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* POC EDITOR */}
        {poc && (
          <section className="space-y-4 rounded-lg border border-slate-200 bg-[var(--surface-soft)] p-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Plan of Correction (editable)
            </h2>

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
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Completion date (target)
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={poc.completion_date || ""}
                  onChange={(e) =>
                    setPoc({
                      ...poc,
                      completion_date: e.target.value || null,
                    })
                  }
                  disabled={!canEditPoc}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Responsible roles / positions
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy("responsible_roles", poc.responsible_roles || "")
                    }
                    className="rounded-full border border-slate-400 bg-[var(--surface)] px-2 py-0.5 text-[11px] text-slate-200 hover:border-emerald-500/60"
                  >
                    {copiedKey === "responsible_roles" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                  value={poc.responsible_roles || ""}
                  onChange={(e) =>
                    setPoc({ ...poc, responsible_roles: e.target.value })
                  }
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
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <button
          type="button"
          onClick={() => onCopy(copyKey, value)}
          className="rounded-full border border-slate-400 bg-[var(--surface)] px-2 py-0.5 text-[11px] text-slate-200 hover:border-emerald-500/60"
        >
          {copiedKey === copyKey ? "Copied!" : "Copy"}
        </button>
      </div>
      <textarea
        className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
