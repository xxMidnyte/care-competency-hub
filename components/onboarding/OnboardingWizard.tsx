"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Step = 1 | 2 | 3 | 4;

type FacilityForm = {
  name: string;
  setting: string;
};

type StaffForm = {
  rawEmails: string;
};

type AssignmentForm = {
  useRecommended: boolean;
};

interface OnboardingWizardProps {
  userId: string;
  orgId: string | null;
  initialOpen?: boolean;
  onCompleted?: () => void;
}

const SETTINGS = [
  "Home Health",
  "LTC / Assisted Living",
  "Hospice",
  "Clinic",
  "Outpatient",
  "Acute Care",
];

export function OnboardingWizard({
  userId,
  orgId,
  initialOpen = true,
  onCompleted,
}: OnboardingWizardProps) {
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [facility, setFacility] = useState<FacilityForm>({
    name: "",
    setting: "",
  });

  const [staff, setStaff] = useState<StaffForm>({ rawEmails: "" });

  const [assignment, setAssignment] = useState<AssignmentForm>({
    useRecommended: true,
  });

  // Close if explicitly dismissed
  const close = () => setOpen(false);

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const skipStep = () => next();

  const handleFinish = async () => {
    setSaving(true);
    setError(null);

    try {
      // TODO: wire into your real tables
      // Example pseudo-logic:

      // 1) Create facility if provided
      if (facility.name.trim()) {
        const { error: facError } = await supabase
          .from("facilities")
          .insert({
            name: facility.name.trim(),
            setting: facility.setting || null,
            org_id: orgId,
          });

        if (facError) throw facError;
      }

      // 2) Create staff from rawEmails
      if (staff.rawEmails.trim()) {
        // Parse emails from textarea (one per line or comma separated)
        const emails = staff.rawEmails
          .split(/[\n,]+/)
          .map((e) => e.trim())
          .filter(Boolean);

        if (emails.length > 0) {
          const rows = emails.map((email) => ({
            email,
            full_name: null,
            org_id: orgId,
          }));

          const { error: staffError } = await supabase
            .from("staff")
            .insert(rows);

          if (staffError) throw staffError;
        }
      }

      // 3) Recommended assignments (placeholder)
      if (assignment.useRecommended) {
        // TODO: call your edge function or insert into staff_competencies
        // For now, just pretend we did something :)
      }

      // 4) Mark onboarding complete on profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", userId);

      if (profileError) throw profileError;

      setStep(4);
      if (onCompleted) onCompleted();
    } catch (err: any) {
      console.error("Onboarding finish error:", err);
      setError(err.message ?? "Something went wrong during onboarding.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Get set up in a few steps
            </h2>
            <p className="text-xs text-slate-400">
              You can change anything later. This just gets you a fast first
              win.
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
          >
            Skip for now
          </button>
        </div>

        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2 text-xs text-slate-400">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`flex-1 h-1 rounded-full ${
                n <= step ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="min-h-[220px]">
          {step === 1 && (
            <StepFacility facility={facility} setFacility={setFacility} />
          )}
          {step === 2 && (
            <StepStaff staff={staff} setStaff={setStaff} />
          )}
          {step === 3 && (
            <StepAssignments
              assignment={assignment}
              setAssignment={setAssignment}
            />
          )}
          {step === 4 && <StepDone />}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Footer buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Step {step} of 4
          </div>
          <div className="flex gap-2">
            {step > 1 && step < 4 && (
              <button
                onClick={prev}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900"
              >
                Back
              </button>
            )}

            {step < 3 && (
              <>
                <button
                  onClick={skipStep}
                  className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900"
                >
                  Skip
                </button>
                <button
                  onClick={next}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-500"
                >
                  Next
                </button>
              </>
            )}

            {step === 3 && (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? "Finishing..." : "Finish setup"}
              </button>
            )}

            {step === 4 && (
              <button
                onClick={close}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-500"
              >
                Go to dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------- Step 1: Facility --------
function StepFacility({
  facility,
  setFacility,
}: {
  facility: FacilityForm;
  setFacility: (f: FacilityForm) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-100">
        Start with your facility
      </h3>
      <p className="text-xs text-slate-400">
        This helps us personalize your competency library and reports.
      </p>

      <label className="flex flex-col gap-1 text-xs text-slate-200">
        Facility name
        <input
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
          placeholder="e.g. St. Cloud Home Health"
          value={facility.name}
          onChange={(e) =>
            setFacility({ ...facility, name: e.target.value })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-200">
        Setting
        <select
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
          value={facility.setting}
          onChange={(e) =>
            setFacility({ ...facility, setting: e.target.value })
          }
        >
          <option value="">Choose a setting</option>
          {SETTINGS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

// -------- Step 2: Staff --------
function StepStaff({
  staff,
  setStaff,
}: {
  staff: StaffForm;
  setStaff: (s: StaffForm) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-100">
        Add your staff (optional)
      </h3>
      <p className="text-xs text-slate-400">
        Paste emails separated by commas or line breaks. You can invite them properly later; this just seeds your list.
      </p>

      <textarea
        className="min-h-[120px] w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
        placeholder={"nurse1@example.com\nnurse2@example.com\ntherapist@example.com"}
        value={staff.rawEmails}
        onChange={(e) => setStaff({ rawEmails: e.target.value })}
      />
    </div>
  );
}

// -------- Step 3: Assignments --------
function StepAssignments({
  assignment,
  setAssignment,
}: {
  assignment: AssignmentForm;
  setAssignment: (a: AssignmentForm) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-100">
        Smart competency assignment
      </h3>
      <p className="text-xs text-slate-400">
        We can pre-assign a recommended starter set of competencies per role.
        You can customize everything later.
      </p>

      <label className="flex items-start gap-2 text-xs text-slate-200">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={assignment.useRecommended}
          onChange={(e) =>
            setAssignment({ useRecommended: e.target.checked })
          }
        />
        <span>
          Automatically assign a recommended starter set for common roles
          (RN, LPN, CNA, PT, OT, SLP, etc.)
        </span>
      </label>

      <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-300">
        <p className="font-semibold text-slate-100 mb-1">
          Preview (conceptual)
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>RN Starter Set — 20+ core competencies</li>
          <li>CNA Essentials — 10+ direct care skills</li>
          <li>Therapy Core (PT/OT/SLP) — documentation + clinical skills</li>
          <li>High-Risk Focus — medication admin, infection control, etc.</li>
        </ul>
        <p className="mt-2 text-[10px] text-slate-500">
          We&apos;ll wire this to your real competency library next.
        </p>
      </div>
    </div>
  );
}

// -------- Step 4: Done --------
function StepDone() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
        ✅
      </div>
      <h3 className="text-sm font-semibold text-slate-100">
        You&apos;re all set!
      </h3>
      <p className="max-w-xs text-xs text-slate-400">
        Your facility, staff, and starter competencies are ready. You can tweak
        everything from the dashboard at any time.
      </p>
    </div>
  );
}
