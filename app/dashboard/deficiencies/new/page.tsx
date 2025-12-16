// app/dashboard/deficiencies/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import { AlertTriangle, ArrowLeft, ClipboardList, Flag, Save } from "lucide-react";

const ui = {
  page: "min-h-screen bg-background text-foreground",
  container: "mx-auto max-w-3xl space-y-6 px-6 py-8",
  headerKicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-2xl font-semibold tracking-tight",
  p: "text-sm text-foreground/60",
  card: "rounded-2xl border border-border bg-card shadow-card",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  textarea:
    "w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnSoft:
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  toastWarn:
    "rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground",
  toastError:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground",
  req: "text-rose-400",
};

function normalizeHasModule(featureFlags: any) {
  // keep backward compat: some places used has_deficiency_module, some used has_survey_shield
  return !!(featureFlags?.has_deficiency_module ?? featureFlags?.has_survey_shield);
}

export default function NewDeficiencyPage() {
  const router = useRouter();

  // ---- ORG CONTEXT ----
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasDefModule = normalizeHasModule(org?.featureFlags);
  const hasModuleAccess = isDevOrg || hasDefModule;

  const canManage =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  // ---- LOCAL STATE ----
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [severity, setSeverity] = useState("");
  const [scope, setScope] = useState("");
  const [surveyDate, setSurveyDate] = useState("");
  const [deficiencyText, setDeficiencyText] = useState("");

  // ---- ACCESS CHECK ----
  useEffect(() => {
    if (orgLoading) return;

    setError(null);

    if (!organizationId || !org) {
      setError("Unable to load your organization.");
      setChecking(false);
      return;
    }

    if (!hasModuleAccess) {
      setError("The deficiency module is not enabled for your organization.");
      setChecking(false);
      return;
    }

    if (!canManage) {
      setError("You do not have permission to add survey deficiencies.");
      setChecking(false);
      return;
    }

    setChecking(false);
  }, [orgLoading, org, organizationId, hasModuleAccess, canManage]);

  const missingRequired = useMemo(() => {
    return !surveyDate || !deficiencyText.trim();
  }, [surveyDate, deficiencyText]);

  // ---- SAVE HANDLER ----
  async function handleSave() {
    if (!organizationId) {
      setError("Missing organization context.");
      return;
    }

    if (!canManage) {
      setError("You do not have permission to add survey deficiencies.");
      return;
    }

    if (missingRequired) {
      setError("Survey date and deficiency text are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("survey_deficiencies")
        .insert({
          org_id: organizationId,
          title: title.trim() ? title.trim() : null,
          tag_code: tagCode.trim() ? tagCode.trim() : null,
          severity: severity.trim() ? severity.trim() : null,
          scope: scope.trim() ? scope.trim() : null,
          survey_date: surveyDate,
          deficiency_text: deficiencyText.trim(),
          status: "open",
        })
        .select("id")
        .single();

      if (insertError || !data) {
        console.error(insertError);
        setError(insertError?.message || "Failed to save deficiency.");
        setSaving(false);
        return;
      }

      router.push(`/dashboard/deficiencies/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving deficiency.");
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className={ui.page}>
        <div className={ui.container}>
          <p className={ui.headerKicker}>Survey</p>
          <h1 className={ui.h1}>Add deficiency</h1>
          <p className={ui.p}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error && (!hasModuleAccess || !canManage || !organizationId)) {
    return (
      <div className={ui.page}>
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            <span>Survey deficiencies</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Add deficiency</h1>
          <p className="text-sm text-rose-300">{error}</p>

          <button
            onClick={() => router.push("/dashboard/deficiencies")}
            className={ui.btnSoft}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className={ui.headerKicker}>Survey</p>
            <h1 className={ui.h1}>Add deficiency</h1>
            <p className={ui.p}>
              Log the tag and citation details so you can build a Plan of Correction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/deficiencies")}
              className={ui.btnSoft}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || missingRequired}
              className={ui.btnPrimary}
              title={
                missingRequired
                  ? "Survey date and deficiency text are required."
                  : "Save"
              }
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save & continue"}
            </button>
          </div>
        </div>

        {/* Form */}
        <section className={`${ui.card} p-5 space-y-5`}>
          {error && (
            <div className={ui.toastError}>
              <div className="font-semibold text-rose-400">Couldn’t save</div>
              <div className="mt-1 text-xs text-foreground/80">{error}</div>
            </div>
          )}

          {missingRequired && (
            <div className={ui.toastWarn}>
              <div className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <div className="font-semibold">Required fields</div>
                  <div className="mt-1 text-xs text-foreground/80">
                    Survey date and deficiency text are required to continue.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className={ui.label}>
                Tag code <span className="text-foreground/40">(optional)</span>
              </label>
              <div className="relative">
                <Flag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                  className={`${ui.input} pl-9`}
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value)}
                  placeholder="e.g. F689"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={ui.label}>
                Survey date <span className={ui.req}>*</span>
              </label>
              <input
                type="date"
                className={ui.input}
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={ui.label}>
              Short title <span className="text-foreground/40">(optional)</span>
            </label>
            <input
              className={ui.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Resident falls – supervision"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className={ui.label}>
                Severity <span className="text-foreground/40">(optional)</span>
              </label>
              <input
                className={ui.input}
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                placeholder="e.g. D, E, F, G, IJ"
              />
            </div>

            <div className="space-y-1">
              <label className={ui.label}>
                Scope <span className="text-foreground/40">(optional)</span>
              </label>
              <input
                className={ui.input}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g. isolated, pattern, widespread"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={ui.label}>
              Deficiency text <span className={ui.req}>*</span>
            </label>
            <textarea
              className={ui.textarea}
              rows={10}
              value={deficiencyText}
              onChange={(e) => setDeficiencyText(e.target.value)}
              placeholder="Paste the narrative from the 2567 / state citation…"
            />
            <p className="text-[11px] text-foreground/60">
              Tip: include enough detail to build a strong Plan of Correction.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
