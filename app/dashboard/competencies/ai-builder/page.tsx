// app/dashboard/competencies/ai-builder/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
const ui = {
  page: "min-h-screen bg-background text-foreground",
  container: "mx-auto max-w-6xl space-y-6 px-6 py-6",
  headerKicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-2xl font-semibold tracking-tight text-foreground",
  p: "text-sm text-muted-foreground",
  card: "rounded-2xl border border-border bg-card shadow-card p-4",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/60",
  helper: "text-[11px] text-muted-foreground",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  textarea:
    "w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  pill:
    "rounded-full border px-3 py-1 text-xs transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  pillOn: "border-primary/40 bg-primary/10 text-primary",
  pillOff: "border-border bg-card text-foreground hover:bg-muted",
  pillOffMuted: "border-border bg-card text-foreground/80 hover:bg-muted",
  toastSuccess:
    "rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground",
  toastError:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground",
};

// ------------------------------
// Main Component
// ------------------------------
export default function AIGeneratorPage() {
  const router = useRouter();

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
  const [generated, setGenerated] = useState<GeneratedContent>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // inline editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasPreview = Object.keys(generated).length > 0;
  const canGenerate = title.trim().length > 0 && selectedRoles.length > 0;

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

    if (!title.trim() || Object.keys(generated).length === 0) {
      setSaveError("Generate a competency before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/competencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          roles: selectedRoles,
          setting,
          risk,
          language,
          sections: generated,
        }),
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

      // OPTIONAL: jump straight to the library detail page
      if (data?.id) {
        router.push(`/dashboard/library/${data.id}`);
      }
    } catch (err) {
      console.error("Save network error:", err);
      setSaveError("Network error saving competency.");
    } finally {
      setIsSaving(false);
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="space-y-2">
          <p className={ui.headerKicker}>Builder</p>
          <h1 className={ui.h1}>AI Competency Builder</h1>
          <p className={ui.p}>
            Generate complete competencies, checklists, and quizzes in any
            language — then tweak them inline before saving.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT - Builder Form */}
          <div className={`space-y-5 ${ui.card}`}>
            {/* Title */}
            <div className="space-y-1">
              <label className={ui.label}>Title</label>
              <input
                className={ui.input}
                placeholder="e.g. Wound Care: Pressure Ulcer Staging"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className={ui.label}>Description (optional)</label>
              <textarea
                className={ui.textarea}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Roles */}
            <div className="space-y-1">
              <label className={ui.label}>Roles</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => {
                  const active = selectedRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={`${ui.pill} ${active ? ui.pillOn : ui.pillOff}`}
                    >
                      {r}
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
                <label className={ui.label}>Setting</label>
                <div className="flex flex-wrap gap-2">
                  {SETTING_OPTIONS.map((s) => {
                    const active = setting === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSetting((prev) => (prev === s ? null : s))
                        }
                        className={`${ui.pill} ${
                          active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : ui.pillOffMuted
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
                <label className={ui.label}>Risk level</label>
                <div className="flex flex-wrap gap-2">
                  {RISK_OPTIONS.map((r) => {
                    const active = risk === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRisk(r)}
                        className={`${ui.pill} ${
                          active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : ui.pillOffMuted
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
              <label className={ui.label}>Language</label>
              <select
                className={ui.input}
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
              <label className={ui.label}>Sections</label>
              <div className="flex flex-wrap gap-2">
                {SECTION_OPTIONS.filter((s) => s.key !== "purpose").map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground/80 hover:bg-muted"
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
              <label className={ui.label}>Special Instructions (optional)</label>
              <textarea
                className={ui.textarea}
                rows={3}
                placeholder='e.g. "Focus heavily on infection control and update for 2025 CMS changes. Keep language simple for CNAs."'
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? "Generating..." : "✨ Generate with AI"}
            </Button>
          </div>

          {/* RIGHT - Preview with inline editing + Save */}
          <div className={`${ui.card} flex flex-col`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Preview</h2>
                <p className={ui.helper}>
                  Click Edit to tweak any section, then save it as a reusable
                  competency.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="hidden sm:inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-foreground/80">
                  Risk: <span className="ml-1 text-foreground">{risk}</span>
                </span>

                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  onClick={handleSave}
                  disabled={isSaving || !hasPreview}
                >
                  {isSaving ? "Saving…" : "Save competency"}
                </Button>
              </div>
            </div>

            {saveMessage && <div className={`${ui.toastSuccess} mb-3`}>{saveMessage}</div>}
            {saveError && (
              <div className={`${ui.toastError} mb-3`}>
                <span className="font-semibold text-red-500">Error:</span>{" "}
                <span className="text-foreground/80">{saveError}</span>
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
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/80">
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
                          <h3 className="text-xs uppercase tracking-wide text-foreground/60">
                            {labelText}
                          </h3>

                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="xs"
                                  onClick={saveEdit}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="xs"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="xs"
                                onClick={() =>
                                  startEdit(sectionKey, content as string | null)
                                }
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <textarea
                            className={`${ui.textarea} text-xs`}
                            rows={6}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
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
      </div>
    </div>
  );
}
