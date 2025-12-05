// components/onboarding/OnboardingChecklist.tsx
"use client";

interface OnboardingChecklistProps {
  steps: {
    id: string;
    label: string;
    completed: boolean;
  }[];
  onClickContinue?: () => void;
  onStepClick?: (id: string) => void; // NEW
}

export function OnboardingChecklist({
  steps,
  onClickContinue,
  onStepClick,
}: OnboardingChecklistProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const total = steps.length;
  const percent = Math.round((completedCount / total) * 100);

  if (completedCount === total) return null;

  return (
    <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-4 text-xs text-slate-100">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
            Onboarding in progress
          </p>
          <p className="text-[11px] text-slate-300">
            {completedCount}/{total} steps complete · {percent}% done
          </p>
        </div>
        <button
          onClick={onClickContinue}
          className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-slate-950 hover:bg-emerald-500"
        >
          Continue
        </button>
      </div>

      <div className="mt-2 space-y-1.5">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick?.(step.id)}
            className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left text-[11px] hover:bg-slate-900/70"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                step.completed
                  ? "border-emerald-500 bg-emerald-500 text-slate-950"
                  : "border-slate-600 text-slate-400"
              }`}
            >
              {step.completed ? "✓" : ""}
            </span>
            <span
              className={
                step.completed
                  ? "text-slate-400 line-through"
                  : "text-slate-100"
              }
            >
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
