// app/dashboard/tracks/[trackId]/ModuleCard.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProgressRing from "./ProgressRing";

type ModuleStatus = "not_started" | "in_progress" | "completed";

type Module = {
  id: string;
  title: string;
  description: string | null;
  status?: ModuleStatus;
};

type Props = {
  module: Module;
  userId: string | null;
  onStatusChange?: (moduleId: string, newStatus: ModuleStatus) => void;
};

export default function ModuleCard({ module, userId, onStatusChange }: Props) {
  const [status, setStatus] = useState<ModuleStatus>(
    module.status ?? "not_started"
  );
  const [saving, setSaving] = useState(false);

  const completed = status === "completed";

  // simple mapping: 0 / 0.5 / 1 for ring
  const ringValue =
    status === "completed" ? 1 : status === "in_progress" ? 0.5 : 0;

  async function handleToggleComplete() {
    if (!userId) {
      alert("Please log in to track your progress.");
      return;
    }

    const newStatus: ModuleStatus = completed ? "not_started" : "completed";

    setSaving(true);
    try {
      const { error } = await supabase.from("user_track_progress").upsert(
        {
          user_id: userId,
          module_id: module.id,
          status: newStatus,
          completed_at:
            newStatus === "completed" ? new Date().toISOString() : null,
        },
        {
          onConflict: "user_id,module_id",
        }
      );

      if (error) {
        console.error(error);
        alert("Could not save progress. Try again.");
        return;
      }

      setStatus(newStatus);
      onStatusChange?.(module.id, newStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2.5 text-xs">
      <div className="flex items-start gap-3">
        <ProgressRing value={ringValue} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-50">
              {module.title}
            </span>
          </div>
          {module.description && (
            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
              {module.description}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleToggleComplete}
        disabled={saving}
        className={`ml-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition
          ${
            completed
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-200"
          }`}
      >
        {saving ? (
          <span className="inline-block h-3 w-3 animate-spin">⏳</span>
        ) : (
          <span className="inline-block h-3 w-3">
            {completed ? "✔️" : "○"}
          </span>
        )}
        <span>{completed ? "Completed" : "Mark complete"}</span>
      </button>
    </div>
  );
}
