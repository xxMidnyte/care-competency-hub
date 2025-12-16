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
// Shared styles
// ------------------------------
const card = "rounded-2xl border border-border bg-card shadow-card";
const subcard = "rounded-2xl border border-border bg-card-2";
const label =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";
const helper = "text-[11px] text-muted-foreground";
const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const textarea =
  "w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const pillBase =
  "rounded-full border px-3 py-1 text-xs transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const primaryBtn =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const primaryBtnWide = "w-full " + primaryBtn;
const secondaryBtn =
  "inline-flex items-center justify-center rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const accentBtn =
  "inline-flex items-center justify-center rounded-full bg-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

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
          ([, v]) => typeof v === "string" && (v as string).trim().length > 0
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

      setSaveMessage("Competency saved successfully.");

      const newId: string | null =
        (data && (data.id as string)) ||
        (data && data.competency && (data.competency.id as string)) ||
        null;

      if (newId) setSavedCompetencyId(newId);
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Builder
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            AI Competency Builder
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate complete competencies, checklists, and quizzes in any
            language — then tweak them inline before saving.
          </p>
        </div>

        {stillLoading ? (
          <div className="rounded-2xl border border-border bg-card shadow-card px-4 py-6 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : !organizationId ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-sm text-foreground">
            <p className="font-semibold text-red-500">
              Organization context could not be loaded.
            </p>
            <p className="mt-1 text-foreground/80">
              Please refresh the page or contact support if this continues.
            </p>
          </div>
        ) : !isManagerOrAdmin ? (
          <div className={`${card} px-4 py-6 text-sm`}>
            <p className="font-semibold text-foreground">
              You don&apos;t have permission to use the AI competency builder.
            </p>
            <p className="mt-1 text-muted-foreground">
              Please contact your administrator if you think this is a mistake.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* LEFT - Builder Form */}
            <div className={`space-y-5 p-4 ${card}`}>
              {/* Title */}
              <div className="space-y-1">
                <label className={label}>Title</label>
                <input
                  className={input}
                  placeholder="e.g. Wound Care: Pressure Ulcer Staging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className={label}>Description (optional)</label>
                <textarea
                  className={textarea}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Roles */}
              <div className="space-y-1">
                <label className={label}>Roles</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((roleOpt) => {
                    const active = selectedRoles.includes(roleOpt);
                    return (
                      <button
                        key={roleOpt}
                        type="button"
                        onClick={() => toggleRole(roleOpt)}
                        className={`${pillBase} ${
                          active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        {roleOpt}
                      </button>
                    );
                  })}
                </div>
                {selectedRoles.length === 0 && (
                  <p className="text-[11px] text-red-500">
                    Select at least one role to generate content.
                  </p>
                )}
              </div>

              {/* Setting + Risk */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Setting */}
                <div className="space-y-1">
                  <label className={label}>Setting</label>
                  <div className="flex flex-wrap gap-2">
                    {SETTING_OPTIONS.map((s) => {
                      const active = setting === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSetting((prev) => (prev === s ? null : s))}
                          className={`${pillBase} ${
                            active
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Risk */}
                <div className="space-y-1">
                  <label className={label}>Risk level</label>
                  <div className="flex flex-wrap gap-2">
                    {RISK_OPTIONS.map((r) => {
                      const active = risk === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRisk(r)}
                          className={`${pillBase} ${
                            active
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className={label}>Language</label>
                <select
                  className={input}
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

              {/* Sections */}
              <div className="space-y-1">
                <label className={label}>Sections</label>
                <div className="flex flex-wrap gap-2">
                  {SECTION_OPTIONS.filter((s) => s.key !== "purpose").map((s) => (
                    <label
                      key={s.key}
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(s.key)}
                        onChange={() => toggleSection(s.key)}
                        className="h-3 w-3 accent-[color:var(--color-primary)]"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1">
                <label className={label}>Special Instructions (optional)</label>
                <textarea
                  className={textarea}
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
                className={primaryBtnWide}
              >
                {isGenerating ? "Generating..." : "✨ Generate with AI"}
              </button>
            </div>

            {/* RIGHT - Preview with inline editing + Save */}
            <div className={`flex flex-col p-4 ${card}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Preview
                  </h2>
                  <p className={helper}>
                    Click Edit to tweak any section, then save it as a reusable
                    competency.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="hidden sm:inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-foreground/80">
                    Risk: <span className="ml-1 text-foreground">{risk}</span>
                  </span>

                  {savedCompetencyId && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/library?highlight=${savedCompetencyId}`
                        )
                      }
                      className={secondaryBtn}
                    >
                      View in library
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !hasPreview || !organizationId}
                    className={accentBtn}
                  >
                    {isSaving ? "Saving…" : "Save competency"}
                  </button>
                </div>
              </div>

              {saveMessage && (
                <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] text-foreground">
                  {saveMessage}
                </div>
              )}

              {saveError && (
                <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-foreground">
                  <span className="font-semibold text-red-500">Error:</span>{" "}
                  {saveError}
                </div>
              )}

              <div className="h-[80vh] overflow-auto rounded-2xl border border-border bg-background p-4 text-sm">
                {!hasPreview && !isGenerating && (
                  <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
                    <div className="mb-3 h-10 w-10 rounded-full border border-dashed border-border" />
                    <p className="font-medium text-foreground">
                      No competency generated yet
                    </p>
                    <p className="mt-1">
                      Fill out the form and click{" "}
                      <span className="font-semibold text-primary">
                        Generate with AI
                      </span>{" "}
                      to see a preview.
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 rounded-full bg-muted" />
                      <div className="h-4 w-20 rounded-full bg-muted" />
                      <div className="h-4 w-14 rounded-full bg-muted" />
                    </div>
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-4/5 rounded bg-muted" />
                  </div>
                )}

                {hasPreview && !isGenerating && (
                  <div className="space-y-5">
                    {/* Title + tags */}
                    <div className="border-b border-border pb-3">
                      <h2 className="text-base font-semibold text-foreground">
                        {title || "Untitled competency"}
                      </h2>
                      {description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedRoles.map((r) => (
                          <span
                            key={r}
                            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/80"
                          >
                            {r}
                          </span>
                        ))}

                        {setting && (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                            {setting}
                          </span>
                        )}

                        {language && (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                            {LANGUAGE_OPTIONS.find((l) => l.value === language)
                              ?.label ?? language}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sections with inline editing */}
                    {Object.entries(generated).map(([sectionKey, content]) => {
                      if (!content || !String(content).trim()) return null;

                      const labelText =
                        SECTION_LABEL_MAP[sectionKey] ??
                        sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);

                      const isEditing = editingKey === sectionKey;

                      return (
                        <div
                          key={sectionKey}
                          className="border-b border-border pb-4 last:border-b-0"
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                              {labelText}
                            </h3>

                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveEdit}
                                    className="rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-foreground/80 transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEdit(sectionKey, content as string | null)
                                  }
                                  className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-foreground/80 transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              className={`${textarea} text-xs`}
                              rows={6}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
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
