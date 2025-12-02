// app/dashboard/tracks/[trackId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TrackHeader from "./TrackHeader";
import TrackSection from "./TrackSection";
import FlowPreview from "./FlowPreview";

type Track = {
  id: string;
  title: string;
  description: string | null;
};

type ModuleStatus = "not_started" | "in_progress" | "completed";

type Module = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  section_id: string;
  status?: ModuleStatus;
};

type Section = {
  id: string;
  title: string;
  order_index: number;
  modules: Module[];
};

export default function TrackDetailPage() {
  const params = useParams();
  const trackId = params?.trackId as string;

  const [track, setTrack] = useState<Track | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // helper to recalc overall progress from sections
  function recomputeProgress(updatedSections: Section[]) {
    const allModules = updatedSections.flatMap((s) => s.modules);
    const total = allModules.length || 1;
    const completed = allModules.filter((m) => m.status === "completed").length;
    setProgress(completed / total);
  }

  useEffect(() => {
    if (!trackId) return;

    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      const { data: trackData, error: trackError } = await supabase
        .from("tracks")
        .select("id, title, description")
        .eq("id", trackId)
        .single();

      if (trackError || !trackData) {
        console.error(trackError);
        setLoading(false);
        return;
      }

      const { data: sectionData, error: sectionError } = await supabase
        .from("track_sections")
        .select("id, title, order_index")
        .eq("track_id", trackId)
        .order("order_index", { ascending: true });

      if (sectionError || !sectionData) {
        console.error(sectionError);
        setLoading(false);
        return;
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("track_modules")
        .select("id, title, description, order_index, section_id")
        .in(
          "section_id",
          sectionData.map((s) => s.id)
        )
        .order("order_index", { ascending: true });

      if (moduleError || !moduleData) {
        console.error(moduleError);
        setLoading(false);
        return;
      }

      let progressMap: Record<string, ModuleStatus> = {};
      if (uid) {
        const { data: progData, error: progError } = await supabase
          .from("user_track_progress")
          .select("module_id, status")
          .eq("user_id", uid);

        if (progError) {
          console.error(progError);
        } else if (progData) {
          progressMap = progData.reduce(
            (acc, row) => {
              acc[row.module_id] = row.status as ModuleStatus;
              return acc;
            },
            {} as Record<string, ModuleStatus>
          );
        }
      }

      const modulesWithStatus: Module[] = moduleData.map((m) => ({
        ...m,
        status: progressMap[m.id] ?? "not_started",
      }));

      const grouped: Section[] = sectionData.map((s) => ({
        ...s,
        modules: modulesWithStatus.filter((m) => m.section_id === s.id),
      }));

      setTrack(trackData);
      setSections(grouped);
      recomputeProgress(grouped);
      setLoading(false);
    }

    load();
  }, [trackId]);

  function handleModuleStatusChange(moduleId: string, newStatus: ModuleStatus) {
    setSections((prev) => {
      const updated = prev.map((section) => ({
        ...section,
        modules: section.modules.map((m) =>
          m.id === moduleId ? { ...m, status: newStatus } : m
        ),
      }));
      recomputeProgress(updated);
      return updated;
    });
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Loading track…</div>;
  }

  if (!track) {
    return <div className="p-6 text-sm text-red-400">Track not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <TrackHeader track={track} progress={progress} />

      <div className="grid gap-6 lg:grid-cols-[2fr,1.1fr]">
        {/* Left: sections + modules */}
        <div className="space-y-4">
          {sections.map((section) => (
            <TrackSection
              key={section.id}
              section={section}
              userId={userId}
              onModuleStatusChange={handleModuleStatusChange}
            />
          ))}
        </div>

        {/* Right: visual flow */}
        <FlowPreview sections={sections} />
      </div>
    </div>
  );
}
