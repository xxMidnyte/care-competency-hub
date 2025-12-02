// app/dashboard/tracks/[trackId]/FlowPreview.tsx
"use client";

type ModuleStatus = "not_started" | "in_progress" | "completed";

type Module = {
  id: string;
  title: string;
  status?: ModuleStatus;
};

type Section = {
  id: string;
  title: string;
  modules: Module[];
};

type Props = {
  sections: Section[];
};

export default function FlowPreview({ sections }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
        Leadership journey
      </p>
      <p className="mt-2 text-sm text-slate-100">
        Visual progression preview
      </p>
      <p className="mt-1">
        Each dot represents a competency. Completed items glow brighter and
        sit along your path toward preceptor and supervisor roles.
      </p>

      <div className="mt-4 space-y-4">
        {sections.map((section, sectionIdx) => (
          <div key={section.id}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {section.title}
            </p>
            <div className="relative pl-4">
              {/* vertical line */}
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-800" />
              <div className="space-y-2">
                {section.modules.map((mod, idx) => {
                  const completed = mod.status === "completed";
                  const inProgress = mod.status === "in_progress";
                  return (
                    <div key={mod.id} className="flex items-center gap-2">
                      <div
                        className={`relative flex h-3 w-3 items-center justify-center rounded-full border ${
                          completed
                            ? "border-emerald-400 bg-emerald-500/30 shadow-[0_0_8px_rgba(45,212,191,0.7)]"
                            : inProgress
                            ? "border-emerald-400/60 bg-emerald-500/10"
                            : "border-slate-600 bg-slate-900"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            completed
                              ? "bg-emerald-300"
                              : inProgress
                              ? "bg-emerald-400/80"
                              : "bg-slate-500"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] text-slate-300">
                        {mod.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <p className="text-[11px] text-slate-500">
            No modules yet. Once competencies are added to this track, your
            path will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
