"use client";

import { useState } from "react";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [setting, setSetting] = useState<string | null>(null);
  const [risk, setRisk] = useState("Medium");
  const [language, setLanguage] = useState("en");
  const [selectedSections, setSelectedSections] = useState<string[]>(
    SECTION_OPTIONS.map((s) => s.key).filter((k) => k !== "purpose") // purpose always on, but no need to toggle
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
          // include purpose + whatever else is toggled
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

      // The API returns { sections: { purpose, objectives, ... } }
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
          // orgId: currentOrgId, // TODO: wire from auth/context
          // createdBy: userId,   // TODO: supabase auth user
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
      // future: router.push(`/competencies/${data.competencyId}`);
    } catch (err) {
      console.error("Save network error:", err);
      setSaveError("Network error saving competency.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        AI Competency Builder
      </h1>
      <p className="text-slate-400 text-sm mt-1">
        Generate complete competencies, checklists, and quizzes in any language
        – then tweak them inline before saving.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* LEFT - Builder Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase">Title</label>
            <input
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70"
              placeholder="e.g. Wound Care: Pressure Ulcer Staging"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase">
              Description (optional)
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Roles */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1 rounded-full text-xs border transition ${
                    selectedRoles.includes(role)
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
                  }`}
                >
                  {role}
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
              <label className="text-xs text-slate-400 uppercase">
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
                    className={`px-3 py-1 rounded-full text-xs border transition ${
                      setting === s
                        ? "bg-sky-500 text-slate-950 border-sky-500"
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
              <label className="text-xs text-slate-400 uppercase">
                Risk level
              </label>
              <div className="flex flex-wrap gap-2">
                {RISK_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    className={`px-3 py-1 rounded-full text-xs border transition ${
                      risk === r
                        ? "bg-amber-400 text-slate-950 border-amber-400"
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
            <label className="text-xs text-slate-400 uppercase">
              Language
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70"
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
            <label className="text-xs text-slate-400 uppercase">
              Sections
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTION_OPTIONS.filter((s) => s.key !== "purpose").map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-slate-700 bg-slate-950 hover:border-emerald-500/70"
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(s.key)}
                    onChange={() => toggleSection(s.key)}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-950"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase">
              Special Instructions (optional)
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70"
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
            className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "✨ Generate with AI"}
          </button>
        </div>

        {/* RIGHT - Preview with inline editing + Save */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Preview
              </h2>
              <p className="text-[11px] text-slate-500">
                Click ✏️ to tweak any section, then save it as a reusable
                competency.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-amber-300">
                Risk: {risk}
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasPreview}
                className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-950 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 h-[80vh] overflow-auto text-sm">
            {!hasPreview && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 text-xs">
                <div className="h-10 w-10 rounded-full border border-dashed border-slate-700 mb-3" />
                <p className="font-medium text-slate-300">
                  No competency generated yet
                </p>
                <p className="mt-1">
                  Fill out the form and click{" "}
                  <span className="text-emerald-400 font-semibold">
                    Generate with AI
                  </span>{" "}
                  to see a preview.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-3 animate-pulse text-xs text-slate-500">
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
                <div className="pb-3 border-b border-slate-800">
                  <h2 className="text-base font-semibold text-slate-50">
                    {title || "Untitled competency"}
                  </h2>
                  {description && (
                    <p className="text-xs text-slate-400 mt-1">
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
                          LANGUAGE_OPTIONS.find((l) => l.value === language)
                            ?.label
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
                      className="pb-4 border-b border-slate-800 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs uppercase text-slate-400 tracking-wide">
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
                                startEdit(sectionKey, content as string | null)
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
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70"
                          rows={6}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
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
    </div>
  );
}
