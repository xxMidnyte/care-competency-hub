// app/dashboard/tracks/[trackId]/TrackSection.tsx
"use client";

import ModuleCard from "./ModuleCard";

type ModuleStatus = "not_started" | "in_progress" | "completed";

type Module = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  status?: ModuleStatus;
};

type Props = {
  section: {
    id: string;
    title: string;
    order_index: number;
    modules: Module[];
  };
  userId: string | null;
  onModuleStatusChange?: (moduleId: string, newStatus: ModuleStatus) => void;
};

export default function TrackSection({
  section,
  userId,
  onModuleStatusChange,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
          {section.title}
        </h2>
      </div>

      <div className="space-y-2">
        {section.modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            userId={userId}
            onStatusChange={onModuleStatusChange}
          />
        ))}
      </div>
    </section>
  );
}
