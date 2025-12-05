// app/dashboard/ai-builder/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useOrg } from "@/hooks/useOrg";

// ------------------------------
// Option sets
// ------------------------------
const ROLE_OPTIONS = [
  "RN",
  "LPN / LVN",
  "CNA",
  "PT",
  "OT",
  "SLP",
  "Home Health Aide",
  "Respiratory Therapist",
  "Office Staff",
];

const SETTING_OPTIONS = [
  "Home Health",
  "LTC / Assisted Living",
  "Acute Care",
  "Outpatient",
  "Hospice",
  "Clinic",
];

const RISK_OPTIONS = ["Low", "Medium", "High", "Critical"];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "so", label: "Somali" },
  { value: "hmn", label: "Hmong" },
];

const SECTION_OPTIONS = [
  { key: "purpose", label: "Purpose" },
  { key: "objectives", label: "Learning objectives" },
  { key: "equipment", label: "Required equipment" },
  { key: "procedure", label: "Procedure / steps" },
  { key: "checklist", label: "Return demo checklist" },
  { key: "quiz", label: "Quiz questions" },
  { key: "policy", label: "Policy references" },
  { key: "documentation", label: "Documentation expectations" },
  { key: "evidence", label: "Evidence requirements" },
];

type GeneratedContent = {
  [key: string]: string | null;
};

const SECTION_LABEL_MAP: Record<string, string> = SECTION_OPTIONS.reduce(
  (acc, s) => {
    acc[s.key] = s.label;
    return acc;
  },
  {} as Record<string, string>
);

// ------------------------------
// Main Component
// ------------------------------
export default function AIGeneratorPage() {
  const router = useRouter();
  const { loading: orgLoading, org, organizationId } = useOrg();

  // Left-side form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [setting, setSetting] = useState<string | null>(null);
  const [risk, setRisk] = useState("Medium");
  const [language, setLanguage] = useState("en");
  const [selectedSections, setSelectedSections] = useState<string[]>(
    SECTION_OPTIONS.map((s) => s.key).filter((k) => k !== "purpose") // purpose always on
  );
  const [specialInstructions, setSpecialInstructions] = useState("");

  // AI + editing state
  const [generated, setGenerated] = useState<GeneratedContent>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Save + org state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCompetencyId, setSavedCompetencyId] = useState<string | null>(
    null
  );

  const [authChecked, setAuthChecked] = useState(false);

  const hasPreview = Object.keys(generated).length > 0;
  const canGenerate = title.trim().length > 0 && selectedRoles.length > 0;

  // ------------------------------
  // Auth check — redirect if not logged in
  // ------------------------------
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setAuthChecked(true);
    }

    checkAuth();
  }, [router]);

  // ------------------------------
  // Helpers
  // ------------------------------
  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const startEdit = (key: string, current: string | null) => {
    setEditingKey(key);
    setEditingValue(current ?? "");
  };

  const saveEdit = () => {
    if (!editingKey) return;
    setGenerated((prev) => ({
      ...prev,
      [editingKey]: editingValue,
    }));
    setEditingKey(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingValue("");
  };

  // ------------------------------
  // 🔥 REAL AI CALL — handleGenerate()
  // ------------------------------
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setEditingKey(null);
    setEditingValue("");
    setSaveMessage(null);
    setSaveError(null);
    setSavedCompetencyId(null);

    try {
      const res = await fetch("/api/competencies/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          roles: selectedRoles,
          setting,
          risk,
          language,
          sections: ["purpose", ...selectedSections],
          specialInstructions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error || "AI error");
        setIsGenerating(false);
        setSaveError(data.error || "Error generating competency.");
        return;
      }

      const cleaned = Object.fromEntries(
        Object.entries((data.sections ?? {}) as Record<string, unknown>).filter(
          ([, v]) => typeof v === "string" && v.trim().length > 0
        )
      ) as GeneratedContent;

      setGenerated(cleaned);
    } catch (err) {
      console.error("Network error:", err);
      setSaveError("Network error talking to AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ------------------------------
  // 💾 Save competency to Supabase
  // ------------------------------
  const handleSave = async () => {
    setSaveMessage(null);
    setSaveError(null);
    setSavedCompetencyId(null);

    if (!title.trim() || Object.keys(generated).length === 0) {
      setSaveError("Generate a competency before saving.");
      return;
    }

    if (!organizationId) {
      console.error("❌ handleSave called without organizationId");
      setSaveError("No organization resolved. Cannot save competency.");
      return;
    }

    const payload = {
      title,
      description,
      roles: selectedRoles,
      setting,
      risk,
      language,
      sections: generated,
      org_id: organizationId,
    };

    console.log("💾 Save payload:", payload);

    setIsSaving(true);
    try {
      const res = await fetch("/api/competencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Save error:", data);
        setSaveError(
          data?.error || "Failed to save competency. Please try again."
        );
        return;
      }

      console.log("✅ Saved competency:", data);
      setSaveMessage("Competency saved successfully.");

      // Try to grab the new competency id from a few likely shapes
      const newId: string | null =
        (data && (data.id as string)) ||
        (data && data.competency && (data.competency.id as string)) ||
        null;

      if (newId) {
        setSavedCompetencyId(newId);
      }
    } catch (err) {
      console.error("Save network error:", err);
      setSaveError("Network error saving competency.");
    } finally {
      setIsSaving(false);
    }
  };

  const role = org?.role;
  const isManagerOrAdmin = role === "admin" || role === "manager";

  const stillLoading = orgLoading || !authChecked;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          AI Competency Builder
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Generate complete competencies, checklists, and quizzes in any
          language – then tweak them inline before saving.
        </p>

        {stillLoading ? (
          <div className="mt-6 px-6 py-8 text-sm text-slate-400">Loading…</div>
        ) : !organizationId ? (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-6 text-sm text-red-100">
            Organization context could not be loaded. Please refresh the page or
            contact support if this continues.
          </div>
        ) : !isManagerOrAdmin ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-[var(--surface-soft)] px-4 py-6 text-sm text-slate-300">
            You don&apos;t have permission to use the AI competency builder.
            Please contact your administrator if you think this is a mistake.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* LEFT - Builder Form */}
            <div className="space-y-5 rounded-2xl border border-slate-800 bg-[var(--surface-soft)] p-5">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-slate-400">
                  Title
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="e.g. Wound Care: Pressure Ulcer Staging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-slate-400">
                  Description (optional)
                </label>
                <textarea
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Roles */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-slate-400">
                  Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((roleOpt) => (
                    <button
                      key={roleOpt}
                      type="button"
                      onClick={() => toggleRole(roleOpt)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selectedRoles.includes(roleOpt)
                          ? "border-emerald-500 bg-emerald-500 text-slate-950"
                          : "border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
                      }`}
                    >
                      {roleOpt}
                    </button>
                  ))}
                </div>
                {selectedRoles.length === 0 && (
                  <p className="text-[11px] text-rose-400">
                    Select at least one role to generate content.
                  </p>
                )}
              </div>

              {/* Setting + Risk */}
              <div className="grid grid-cols-2 gap-3">
                {/* Setting */}
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-slate-400">
                    Setting
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SETTING_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSetting((prev) => (prev === s ? null : s))
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          setting === s
                            ? "border-sky-500 bg-sky-500 text-slate-950"
                            : "border-slate-700 text-slate-300 hover:border-sky-400 hover:text-sky-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk */}
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-slate-400">
                    Risk level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RISK_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRisk(r)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          risk === r
                            ? "border-amber-400 bg-amber-400 text-slate-950"
                            : "border-slate-700 text-slate-300 hover:border-amber-300 hover:text-amber-100"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-slate-400">
                  Language
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sections (excluding purpose which is always present) */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-slate-400">
                  Sections
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECTION_OPTIONS.filter((s) => s.key !== "purpose").map(
                    (s) => (
                      <label
                        key={s.key}
                        className="flex items-center gap-1 rounded-full border border-slate-700 bg-[var(--surface)] px-2 py-1 text-[11px] hover:border-emerald-500/70"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(s.key)}
                          onChange={() => toggleSection(s.key)}
                          className="h-3 w-3 rounded border-slate-600 bg-transparent"
                        />
                        {s.label}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-slate-400">
                  Special Instructions (optional)
                </label>
                <textarea
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder='e.g. "Focus heavily on infection control and update for 2025 CMS changes. Keep language simple for CNAs."'
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="w-full rounded-md bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "✨ Generate with AI"}
              </button>
            </div>

            {/* RIGHT - Preview with inline editing + Save */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-[var(--surface-soft)] p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Preview
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Click ✏️ to tweak any section, then save it as a reusable
                    competency.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-amber-300 sm:inline-block">
                    Risk: {risk}
                  </span>
                  {savedCompetencyId && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/library?highlight=${savedCompetencyId}`
                        )
                      }
                      className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                    >
                      View in library
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !hasPreview || !organizationId}
                    className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving…" : "Save competency"}
                  </button>
                </div>
              </div>

              {saveMessage && (
                <div className="mb-2 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-200">
                  {saveMessage}
                </div>
              )}

              {saveError && (
                <div className="mb-2 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-200">
                  {saveError}
                </div>
              )}

              <div className="h-[80vh] overflow-auto rounded-xl border border-slate-800 bg-[var(--surface)] p-4 text-sm">
                {!hasPreview && !isGenerating && (
                  <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-500">
                    <div className="mb-3 h-10 w-10 rounded-full border border-dashed border-slate-700" />
                    <p className="font-medium text-slate-300">
                      No competency generated yet
                    </p>
                    <p className="mt-1">
                      Fill out the form and click{" "}
                      <span className="font-semibold text-emerald-400">
                        Generate with AI
                      </span>{" "}
                      to see a preview.
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="space-y-3 text-xs text-slate-500">
                    <div className="h-4 w-2/3 rounded bg-slate-800" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 rounded-full bg-slate-800" />
                      <div className="h-4 w-20 rounded-full bg-slate-800" />
                      <div className="h-4 w-14 rounded-full bg-slate-800" />
                    </div>
                    <div className="h-3 w-full rounded bg-slate-800" />
                    <div className="h-3 w-5/6 rounded bg-slate-800" />
                    <div className="h-3 w-4/5 rounded bg-slate-800" />
                  </div>
                )}

                {hasPreview && !isGenerating && (
                  <div className="space-y-5">
                    {/* Title + tags */}
                    <div className="border-b border-slate-800 pb-3">
                      <h2 className="text-base font-semibold">
                        {title || "Untitled competency"}
                      </h2>
                      {description && (
                        <p className="mt-1 text-xs text-slate-400">
                          {description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedRoles.map((r) => (
                          <span
                            key={r}
                            className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200"
                          >
                            {r}
                          </span>
                        ))}
                        {setting && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-300">
                            {setting}
                          </span>
                        )}
                        {language && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                            {
                              LANGUAGE_OPTIONS.find(
                                (l) => l.value === language
                              )?.label
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sections with inline editing */}
                    {Object.entries(generated).map(([sectionKey, content]) => {
                      if (!content || !String(content).trim()) return null;

                      const label =
                        SECTION_LABEL_MAP[sectionKey] ??
                        sectionKey.charAt(0).toUpperCase() +
                          sectionKey.slice(1);

                      const isEditing = editingKey === sectionKey;

                      return (
                        <div
                          key={sectionKey}
                          className="border-b border-slate-800 pb-4 last:border-b-0"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <h3 className="text-xs uppercase tracking-wide text-slate-400">
                              {label}
                            </h3>
                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveEdit}
                                    className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-medium text-slate-950 hover:bg-emerald-400"
                                  >
                                    ✅ Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-300 hover:border-rose-400 hover:text-rose-300"
                                  >
                                    ✕ Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEdit(
                                      sectionKey,
                                      content as string | null
                                    )
                                  }
                                  className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                                >
                                  ✏️ Edit
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none shadow-sm transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              rows={6}
                              value={editingValue}
                              onChange={(e) =>
                                setEditingValue(e.target.value)
                              }
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap text-xs text-slate-200">
                              {content}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
