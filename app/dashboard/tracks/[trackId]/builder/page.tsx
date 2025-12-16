// app/dashboard/tracks/[trackId]/builder/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Track = {
  id: string;
  title: string | null;
  description: string | null;
};

type SectionRow = {
  id: string;
  track_id: string;
  title: string;
  order_index: number;
};

type ModuleRow = {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  order_index: number;
  requires_signoff: boolean | null;
};

type Section = SectionRow & { modules: ModuleRow[] };

const card = "rounded-2xl border border-border bg-card shadow-card";
const btn =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed";
const btnDanger =
  "inline-flex items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed";

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] disabled:opacity-60";
const textarea =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] disabled:opacity-60";

const pill =
  "rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-foreground/70 shadow-sm";

function isManagerRole(role: string | null | undefined) {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "manager" || r === "dev";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function summarizeSection(section: Section) {
  const total = section.modules.length;
  const signoffs = section.modules.filter((m) => !!m.requires_signoff).length;
  return { total, signoffs };
}

export default function TrackBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const trackId = params?.trackId as string;

  const { org, loading: orgLoading } = useOrg();
  const canManage = isManagerRole(org?.role);

  const [loading, setLoading] = useState(true);

  const [track, setTrack] = useState<Track | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const [newSectionTitle, setNewSectionTitle] = useState("");

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  const [newModuleSignoff, setNewModuleSignoff] = useState(false);

  const [savingMeta, setSavingMeta] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // “dirty” detection
  const initialMetaRef = useRef<{ title: string; desc: string } | null>(null);
  const metaDirty = useMemo(() => {
    if (!initialMetaRef.current) return false;
    return (
      (titleDraft ?? "").trim() !== (initialMetaRef.current.title ?? "").trim() ||
      (descDraft ?? "").trim() !== (initialMetaRef.current.desc ?? "").trim()
    );
  }, [titleDraft, descDraft]);

  function flash(type: "success" | "error", msg: string, ms = 2500) {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), ms);
  }

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) ?? null,
    [sections, selectedSectionId]
  );

  useEffect(() => {
    if (!trackId) return;

    async function load() {
      setLoading(true);

      const { data: trackData, error: trackErr } = await supabase
        .from("tracks")
        .select("id, title, description")
        .eq("id", trackId)
        .single();

      if (trackErr || !trackData) {
        console.error("Track load error:", trackErr);
        setLoading(false);
        return;
      }

      const { data: sectionRows, error: sectionErr } = await supabase
        .from("track_sections")
        .select("id, track_id, title, order_index")
        .eq("track_id", trackId)
        .order("order_index", { ascending: true });

      if (sectionErr) {
        console.error("Section load error:", sectionErr);
        setLoading(false);
        return;
      }

      const sectionIds = (sectionRows || []).map((s) => s.id);
      let moduleRows: ModuleRow[] = [];

      if (sectionIds.length > 0) {
        const { data: modules, error: modErr } = await supabase
          .from("track_modules")
          .select("id, section_id, title, description, order_index, requires_signoff")
          .in("section_id", sectionIds)
          .order("order_index", { ascending: true });

        if (modErr) console.error("Module load error:", modErr);
        moduleRows = (modules as ModuleRow[]) || [];
      }

      const grouped: Section[] = ((sectionRows as SectionRow[] | null) || []).map((s) => ({
        ...s,
        modules: moduleRows
          .filter((m) => m.section_id === s.id)
          .sort((a, b) => a.order_index - b.order_index),
      }));

      setTrack(trackData as Track);
      setTitleDraft(trackData.title ?? "");
      setDescDraft(trackData.description ?? "");
      initialMetaRef.current = { title: trackData.title ?? "", desc: trackData.description ?? "" };

      setSections(grouped);
      setSelectedSectionId(grouped[0]?.id ?? null);
      setLoading(false);
    }

    load();
  }, [trackId]);

  async function saveTrackMeta() {
    if (!track) return;
    setSavingMeta(true);

    const nextTitle = titleDraft.trim() || null;
    const nextDesc = descDraft.trim() || null;

    const { error } = await supabase
      .from("tracks")
      .update({ title: nextTitle, description: nextDesc })
      .eq("id", track.id);

    if (error) {
      console.error("Save track meta error:", error);
      flash("error", "Could not save track details.");
      setSavingMeta(false);
      return;
    }

    setTrack((prev) => (prev ? { ...prev, title: nextTitle, description: nextDesc } : prev));
    initialMetaRef.current = { title: nextTitle ?? "", desc: nextDesc ?? "" };
    flash("success", "Saved");
    setSavingMeta(false);
  }

  async function addSection() {
    const title = newSectionTitle.trim();
    if (!title || !trackId) return;

    const nextIndex = sections.length ? Math.max(...sections.map((s) => s.order_index)) + 1 : 1;

    const { data, error } = await supabase
      .from("track_sections")
      .insert({ track_id: trackId, title, order_index: nextIndex })
      .select("id, track_id, title, order_index")
      .single();

    if (error || !data) {
      console.error("Add section error:", error);
      flash("error", "Could not add section.");
      return;
    }

    setSections((prev) => [...prev, { ...(data as SectionRow), modules: [] }]);
    setNewSectionTitle("");
    setSelectedSectionId((data as SectionRow).id);
    flash("success", "Section added");
  }

  async function updateSectionTitle(sectionId: string, title: string) {
    const v = title.trim();
    if (!v) return;

    const { error } = await supabase.from("track_sections").update({ title: v }).eq("id", sectionId);
    if (error) {
      console.error("Update section title error:", error);
      flash("error", "Could not save section title.");
      return;
    }

    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, title: v } : s)));
    flash("success", "Section updated");
  }

  async function deleteSection(sectionId: string) {
    const confirmText = prompt('Type "DELETE" to remove this section and all its modules.');
    if (confirmText !== "DELETE") return;

    const { error } = await supabase.from("track_sections").delete().eq("id", sectionId);
    if (error) {
      console.error("Delete section error:", error);
      flash("error", "Could not delete section.");
      return;
    }

    const remaining = sections.filter((s) => s.id !== sectionId);
    setSections(remaining);
    setSelectedSectionId((prev) => {
      if (prev === sectionId) return remaining[0]?.id ?? null;
      return prev;
    });
    flash("success", "Section deleted");
  }

  async function moveSection(sectionId: string, direction: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;

    const swapIdx = clamp(idx + direction, 0, sections.length - 1);
    if (swapIdx === idx) return;

    const a = sections[idx];
    const b = sections[swapIdx];

    const results = await Promise.all([
      supabase.from("track_sections").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("track_sections").update({ order_index: a.order_index }).eq("id", b.id),
    ]);

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error("Move section error:", failed.error);
      flash("error", "Could not reorder sections.");
      return;
    }

    const next = [...sections]
      .map((s) => {
        if (s.id === a.id) return { ...s, order_index: b.order_index };
        if (s.id === b.id) return { ...s, order_index: a.order_index };
        return s;
      })
      .sort((x, y) => x.order_index - y.order_index);

    setSections(next);
  }

  async function addModule() {
    if (!selectedSectionId) return;
    const title = newModuleTitle.trim();
    const description = newModuleDesc.trim() || null;
    if (!title) return;

    const section = sections.find((s) => s.id === selectedSectionId);
    const nextIndex = section?.modules?.length ? Math.max(...section.modules.map((m) => m.order_index)) + 1 : 1;

    const { data, error } = await supabase
      .from("track_modules")
      .insert({
        section_id: selectedSectionId,
        title,
        description,
        order_index: nextIndex,
        requires_signoff: newModuleSignoff,
      })
      .select("id, section_id, title, description, order_index, requires_signoff")
      .single();

    if (error || !data) {
      console.error("Add module error:", error);
      flash("error", "Could not add module.");
      return;
    }

    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? { ...s, modules: [...s.modules, data as ModuleRow].sort((a, b) => a.order_index - b.order_index) }
          : s
      )
    );

    setNewModuleTitle("");
    setNewModuleDesc("");
    setNewModuleSignoff(false);
    flash("success", "Module added");
  }

  async function updateModule(
    moduleId: string,
    patch: Partial<Pick<ModuleRow, "title" | "description" | "requires_signoff">>
  ) {
    const { error } = await supabase.from("track_modules").update(patch).eq("id", moduleId);
    if (error) {
      console.error("Update module error:", error);
      flash("error", "Could not save module.");
      return;
    }

    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        modules: s.modules.map((m) => (m.id === moduleId ? { ...m, ...patch } : m)),
      }))
    );

    flash("success", "Module saved");
  }

  async function deleteModule(moduleId: string) {
    if (!confirm("Delete this module?")) return;

    const { error } = await supabase.from("track_modules").delete().eq("id", moduleId);
    if (error) {
      console.error("Delete module error:", error);
      flash("error", "Could not delete module.");
      return;
    }

    setSections((prev) => prev.map((s) => ({ ...s, modules: s.modules.filter((m) => m.id !== moduleId) })));
    flash("success", "Module deleted");
  }

  async function moveModule(sectionId: string, moduleId: string, direction: -1 | 1) {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;

    const idx = sec.modules.findIndex((m) => m.id === moduleId);
    if (idx < 0) return;

    const swapIdx = clamp(idx + direction, 0, sec.modules.length - 1);
    if (swapIdx === idx) return;

    const a = sec.modules[idx];
    const b = sec.modules[swapIdx];

    const results = await Promise.all([
      supabase.from("track_modules").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("track_modules").update({ order_index: a.order_index }).eq("id", b.id),
    ]);

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error("Move module error:", failed.error);
      flash("error", "Could not reorder modules.");
      return;
    }

    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const nextMods = s.modules
          .map((m) => {
            if (m.id === a.id) return { ...m, order_index: b.order_index };
            if (m.id === b.id) return { ...m, order_index: a.order_index };
            return m;
          })
          .sort((x, y) => x.order_index - y.order_index);
        return { ...s, modules: nextMods };
      })
    );
  }

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-foreground/60">Loading builder…</div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-rose-300">Track not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* sticky header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Tracks · Builder
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                {track.title || "Untitled track"}
              </h1>
              {metaDirty ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  Unsaved changes
                </span>
              ) : (
                <span className={pill}>Saved</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => router.push(`/dashboard/tracks/${track.id}`)} className={btnSoft}>
              View track
            </button>
            <button type="button" onClick={() => router.push(`/dashboard/tracks/${track.id}/analytics`)} className={btnSoft}>
              Analytics
            </button>
            <button type="button" onClick={() => router.push(`/dashboard/tracks/${track.id}/assign`)} className={btnSoft} disabled={!canManage}>
              Assign
            </button>
            <button type="button" onClick={saveTrackMeta} disabled={!canManage || savingMeta || !metaDirty} className={btn}>
              {savingMeta ? "Saving…" : "Save details"}
            </button>
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed right-6 top-20 z-50">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-card ${
              toast.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/25 bg-rose-500/10 text-rose-200"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {!canManage && (
          <div className={`${card} p-5 text-sm text-foreground/70`}>
            You don’t have permission to edit tracks in this organization.
          </div>
        )}

        {/* Track meta */}
        <div className={`${card} p-5`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Track title
              </label>
              <input className={input} value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} disabled={!canManage} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Description
              </label>
              <input className={input} value={descDraft} onChange={(e) => setDescDraft(e.target.value)} disabled={!canManage} />
            </div>
          </div>

          <p className="mt-3 text-sm text-foreground/60">
            Sections are major themes. Modules are individual steps (competency, read & sign, clarifications, sign-off, etc.).
          </p>
        </div>

        {/* Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
          {/* Left: sections list */}
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Sections</h2>
              <span className="text-xs text-foreground/50">{sections.length}</span>
            </div>

            <div className="mt-3 space-y-2">
              {sections.map((s, idx) => {
                const active = s.id === selectedSectionId;

                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSectionId(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedSectionId(s.id);
                      }
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border bg-background hover:opacity-90"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{s.title}</span>
                      <span className="text-xs text-foreground/50">
                        {s.modules.length} module{s.modules.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(s.id, -1);
                        }}
                        disabled={!canManage || idx === 0}
                        className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/70 disabled:opacity-50"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(s.id, 1);
                        }}
                        disabled={!canManage || idx === sections.length - 1}
                        className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/70 disabled:opacity-50"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = prompt("Rename section", s.title);
                          if (next && next.trim()) renameSection(s.id, next);
                        }}
                        disabled={!canManage}
                        className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/70 disabled:opacity-50"
                      >
                        Rename
                      </button>
              
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSection(s.id);
                        }}
                        disabled={!canManage}
                        className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-200 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {sections.length === 0 && (
                <div className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground/60">
                  <p className="font-semibold text-foreground">Start with a section</p>
                  <p className="mt-1">
                    Example: “Operational Awareness”, “Clinical Excellence”, “Safety & Compliance”.
                  </p>
                </div>
              )}
            </div>

            {/* Add section */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Add section
              </label>
              <input
                className={input}
                placeholder="e.g. Operational Awareness"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                disabled={!canManage}
              />
              <button type="button" onClick={addSection} disabled={!canManage || !newSectionTitle.trim()} className={btnSoft}>
                Add section
              </button>
            </div>
          </div>

          {/* Right: selected section editor */}
          <div className={`${card} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {selectedSection ? `Modules · ${selectedSection.title}` : "Select a section"}
                </h2>
                <p className="mt-1 text-sm text-foreground/60">
                  Modules are the steps inside a section. Keep them short and measurable.
                </p>
              </div>
            </div>

            {!selectedSection ? (
              <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-sm text-foreground/60">
                Choose a section on the left to edit modules.
              </div>
            ) : (
              <>
                {/* Add module */}
                <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    Add module
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                        Title
                      </label>
                      <input
                        className={input}
                        placeholder="e.g. KPI Awareness"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        disabled={!canManage}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                        Sign-off
                      </label>
                      <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                        <input
                          type="checkbox"
                          checked={newModuleSignoff}
                          onChange={(e) => setNewModuleSignoff(e.target.checked)}
                          disabled={!canManage}
                        />
                        <span className="text-sm text-foreground/70">
                          Manager must verify completion
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                        Description
                      </label>
                      <textarea
                        className={textarea}
                        rows={2}
                        placeholder="Optional details"
                        value={newModuleDesc}
                        onChange={(e) => setNewModuleDesc(e.target.value)}
                        disabled={!canManage}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button type="button" onClick={addModule} disabled={!canManage || !newModuleTitle.trim()} className={btn}>
                        Add module
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modules list */}
                <div className="mt-6 space-y-2">
                  {selectedSection.modules.map((m, idx) => (
                    <ModuleEditor
                      key={m.id}
                      module={m}
                      canManage={!!canManage}
                      disableUp={idx === 0}
                      disableDown={idx === selectedSection.modules.length - 1}
                      onMoveUp={() => moveModule(selectedSection.id, m.id, -1)}
                      onMoveDown={() => moveModule(selectedSection.id, m.id, 1)}
                      onSave={(patch) => updateModule(m.id, patch)}
                      onDelete={() => deleteModule(m.id)}
                    />
                  ))}

                  {selectedSection.modules.length === 0 && (
                    <div className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground/60">
                      No modules yet. Add your first module above.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-sm text-foreground/70">
            Next evolution (when you’re ready): convert modules to typed steps (Competency/Policy/Upload/Quiz/Sign-off) and
            move progress to be <span className="font-semibold">assignment-based</span>. That unlocks the true 10,000-ft “flow”
            view and “on pace” tracking.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ inline components ------------------------------ */

function InlineRename({
  label,
  initialValue,
  disabled,
  onSave,
}: {
  label: string;
  initialValue: string;
  disabled?: boolean;
  onSave: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => setValue(initialValue), [initialValue]);

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground/70 disabled:opacity-50"
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        className="w-44 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-semibold text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button
        type="button"
        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200"
        onClick={() => {
          const v = value.trim();
          if (v) onSave(v);
          setEditing(false);
        }}
      >
        Save
      </button>
      <button
        type="button"
        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground/70"
        onClick={() => {
          setValue(initialValue);
          setEditing(false);
        }}
      >
        Cancel
      </button>
    </div>
  );
}

function ModuleEditor({
  module,
  canManage,
  disableUp,
  disableDown,
  onMoveUp,
  onMoveDown,
  onSave,
  onDelete,
}: {
  module: ModuleRow;
  canManage: boolean;
  disableUp: boolean;
  disableDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (patch: Partial<Pick<ModuleRow, "title" | "description" | "requires_signoff">>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState(module.title);
  const [desc, setDesc] = useState(module.description ?? "");
  const [signoff, setSignoff] = useState(!!module.requires_signoff);

  const dirty = useMemo(() => {
    return (
      title.trim() !== module.title.trim() ||
      (desc.trim() || "") !== (module.description ?? "").trim() ||
      signoff !== !!module.requires_signoff
    );
  }, [title, desc, signoff, module.title, module.description, module.requires_signoff]);

  useEffect(() => {
    setTitle(module.title);
    setDesc(module.description ?? "");
    setSignoff(!!module.requires_signoff);
  }, [module.id, module.title, module.description, module.requires_signoff]);

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 text-left"
        >
          <p className="text-sm font-semibold text-foreground">
            {module.title}
          </p>
          <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
            {module.description || "No description."}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/60">
              Order: {module.order_index}
            </span>

            {module.requires_signoff ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                Sign-off required
              </span>
            ) : (
              <span className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/50">
                Self-complete
              </span>
            )}

            {dirty && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                Unsaved
              </span>
            )}
          </div>
        </button>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canManage || disableUp}
              className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/70 disabled:opacity-50"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canManage || disableDown}
              className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground/70 disabled:opacity-50"
            >
              ↓
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground/70"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={!canManage}
            className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Title
            </label>
            <input
              className={input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canManage}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Sign-off
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <input
                type="checkbox"
                checked={signoff}
                onChange={(e) => setSignoff(e.target.checked)}
                disabled={!canManage}
              />
              <span className="text-sm text-foreground/70">
                Manager must verify completion
              </span>
            </label>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Description
            </label>
            <textarea
              className={textarea}
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={!canManage}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={btn}
              disabled={!canManage || !dirty || !title.trim()}
              onClick={() => {
                onSave({
                  title: title.trim(),
                  description: desc.trim() || null,
                  requires_signoff: signoff,
                });
                setOpen(false);
              }}
            >
              Save module
            </button>

            <button
              type="button"
              className={btnSoft}
              onClick={() => {
                setTitle(module.title);
                setDesc(module.description ?? "");
                setSignoff(!!module.requires_signoff);
                setOpen(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
