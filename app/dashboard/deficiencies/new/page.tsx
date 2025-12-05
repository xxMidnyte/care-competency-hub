"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

export default function NewDeficiencyPage() {
  const router = useRouter();

  // ---- ORG CONTEXT ----
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasDefModule = org?.featureFlags?.has_deficiency_module ?? false;
  const hasModuleAccess = isDevOrg || hasDefModule;

  const canManage =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  // ---- LOCAL STATE ----
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [severity, setSeverity] = useState("");
  const [scope, setScope] = useState("");
  const [surveyDate, setSurveyDate] = useState("");
  const [deficiencyText, setDeficiencyText] = useState("");

  // ---- INITIAL LOAD / ACCESS CHECK ----
  useEffect(() => {
    if (orgLoading) return;

    try {
      setLoading(true);
      setError(null);

      if (!organizationId || !org) {
        setError("Unable to load your organization.");
        return;
      }

      if (!hasModuleAccess) {
        setError("The deficiency module is not enabled for your organization.");
        return;
      }

      if (!canManage) {
        setError("You do not have permission to add survey deficiencies.");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [orgLoading, org, organizationId, hasModuleAccess, canManage]);

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

    setSaving(true);
    setError(null);

    try {
      if (!surveyDate || !deficiencyText.trim()) {
        setError("Survey date and deficiency text are required.");
        setSaving(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("survey_deficiencies")
        .insert({
          org_id: organizationId,
          title: title || null,
          tag_code: tagCode || null,
          severity: severity || null,
          scope: scope || null,
          survey_date: surveyDate,
          deficiency_text: deficiencyText,
          status: "open",
        })
        .select("id")
        .single();

      if (insertError || !data) {
        console.error(insertError);
        setError("Failed to save deficiency.");
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

  // ---- LOADING / ACCESS ERRORS ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="p-6 text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  if (error && (!hasModuleAccess || !canManage || !organizationId)) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6 max-w-2xl space-y-3">
          <h1 className="text-xl font-semibold">Add survey deficiency</h1>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // ---- MAIN FORM ----
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Add survey deficiency
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record the tag and citation details so you can generate a Plan of
            Correction.
          </p>
        </div>

        {/* FORM CARD */}
        <section className="space-y-4 rounded-xl border border-slate-200 bg-[var(--surface-soft)] p-4 shadow-sm">
          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Tag code (e.g. F689)
              </label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={tagCode}
                onChange={(e) => setTagCode(e.target.value)}
                placeholder="F689"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Survey date
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Short title
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resident falls – supervision"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Severity (e.g. D, E, F, G, IJ)
              </label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                placeholder="F"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Scope (e.g. isolated, pattern, widespread)
              </label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="pattern"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Deficiency text (from the 2567 / state citation)
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={8}
              value={deficiencyText}
              onChange={(e) => setDeficiencyText(e.target.value)}
              placeholder="Paste the narrative of the deficiency here..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save & continue to POC"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
