// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

type Profile = {
  id: string;
  has_completed_onboarding: boolean;
  org_id: string | null;
};

// tweak these if your routes differ
const ROUTES = {
  login: "/login",
  facilities: "/dashboard/facilities",
  staff: "/dashboard/staff",
  assign: "/dashboard/assign",
  reports: "/dashboard/reports",
  createCompetency: "/dashboard/competencies/new",
  aiBuilder: "/dashboard/competencies/ai-builder",
  surveyPocs: "/dashboard/deficiencies", // 🔹 NEW: Survey & POCs hub
};

type OnboardingFlags = {
  facility: boolean;
  staff: boolean;
  assign: boolean;
  invite: boolean;
  report: boolean;
};

export default function DashboardPage() {
  const router = useRouter();

  const [roleLabel, setRoleLabel] = useState("Manager");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const [onboardingFlags, setOnboardingFlags] = useState<OnboardingFlags>({
    facility: false,
    staff: false,
    assign: false,
    invite: false,
    report: false,
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // not logged in → bounce to login
      if (!user) {
        setRedirecting(true);
        router.replace(ROUTES.login);
        return;
      }

      const meta = (user.user_metadata || {}) as any;
      const role = meta.role || meta.user_role || "Manager";
      setRoleLabel(role);

      // 1) Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, has_completed_onboarding, org_id")
        .eq("id", user.id)
        .single();

      let currentProfile: Profile;

      if (!profileError && profileData) {
        currentProfile = profileData as Profile;
      } else {
        // fallback if no profile row exists yet
        currentProfile = {
          id: user.id,
          has_completed_onboarding: false,
          org_id: null,
        };
      }

      setProfile(currentProfile);

      // 2) Derive onboarding flags from real data (org, facilities, staff, etc.)
      const orgId = currentProfile.org_id;

      let hasFacility = false;
      let hasStaff = false;

      if (orgId) {
        // check if there is at least one facility for this org
        const { data: facs, error: facError } = await supabase
          .from("facilities")
          .select("id")
          .eq("org_id", orgId)
          .limit(1);

        if (!facError && facs && facs.length > 0) {
          hasFacility = true;
        }

        // check if there is at least one staff member for this org
        const { data: staffRows, error: staffError } = await supabase
          .from("staff")
          .select("id")
          .eq("org_id", orgId)
          .limit(1);

        if (!staffError && staffRows && staffRows.length > 0) {
          hasStaff = true;
        }
      }

      // For now we’ll treat assign/invite/report as TODOs and infer some basics:
      const flags: OnboardingFlags = {
        facility: !!orgId && hasFacility,
        staff: !!orgId && hasStaff,
        // you can later wire these to real tables (e.g. staff_competencies, invites, reports)
        assign: false,
        invite: false,
        report: false,
      };

      setOnboardingFlags(flags);

      const allStepsComplete =
        flags.facility &&
        flags.staff &&
        flags.assign &&
        flags.invite &&
        flags.report;

      // 3) Decide whether to show wizard
      if (currentProfile.has_completed_onboarding) {
        // user explicitly finished onboarding previously → never show wizard
        setShowWizard(false);
      } else if (allStepsComplete) {
        // data is already fully set up → silently mark onboarding complete & hide wizard
        await supabase
          .from("profiles")
          .update({ has_completed_onboarding: true })
          .eq("id", currentProfile.id);

        setProfile({
          ...currentProfile,
          has_completed_onboarding: true,
        });
        setShowWizard(false);
      } else {
        // some steps missing → show wizard
        setShowWizard(true);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  const isAdmin = roleLabel.toLowerCase() === "admin";

  const subtitle = isAdmin
    ? "High-level view of your organization, facilities, and competency workload."
    : "High-level view of your facilities and competency workload.";

  const checklistSteps = [
    {
      id: "facility",
      label: "Add your facility",
      completed: onboardingFlags.facility,
    },
    {
      id: "staff",
      label: "Import or add staff",
      completed: onboardingFlags.staff,
    },
    {
      id: "assign",
      label: "Assign starter competencies",
      completed: onboardingFlags.assign,
    },
    {
      id: "invite",
      label: "Invite staff to log in",
      completed: onboardingFlags.invite,
    },
    {
      id: "report",
      label: "Review your dashboard report",
      completed: onboardingFlags.report,
    },
  ];

  const handleChecklistStepClick = (id: string) => {
    switch (id) {
      case "facility":
        router.push(ROUTES.facilities);
        break;
      case "staff":
      case "invite":
        router.push(ROUTES.staff);
        break;
      case "assign":
        router.push(ROUTES.assign);
        break;
      case "report":
        router.push(ROUTES.reports);
        break;
      default:
        break;
    }
  };

  const handleCreateCompetency = () => {
    router.push(ROUTES.createCompetency);
  };

  const handleAiBuilder = () => {
    router.push(ROUTES.aiBuilder);
  };

  const handleAssignCompetencies = () => {
    router.push(ROUTES.assign);
  };

  const handleSurveyPocs = () => {
    router.push(ROUTES.surveyPocs);
  };

  if (loading || redirecting) {
    return (
      <div className="p-6 text-sm text-slate-300">
        Loading...
      </div>
    );
  }

  const allChecklistDone = checklistSteps.every((s) => s.completed);

  return (
    <div className="p-6 space-y-6">
      {/* ONBOARDING WIZARD MODAL */}
      {profile && showWizard && (
        <OnboardingWizard
          userId={profile.id}
          orgId={profile.org_id}
          initialOpen={true}
          onCompleted={async () => {
            setShowWizard(false);
            setProfile((prev) =>
              prev ? { ...prev, has_completed_onboarding: true } : prev
            );
            // you could also refresh onboardingFlags here if the wizard
            // creates facility/staff/etc.
          }}
        />
      )}

      {/* ONBOARDING CHECKLIST – hide if profile says done OR all steps are done */}
      {!profile?.has_completed_onboarding && !allChecklistDone && (
        <OnboardingChecklist
          steps={checklistSteps}
          onClickContinue={() => setShowWizard(true)}
          onStepClick={handleChecklistStepClick}
        />
      )}

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            {roleLabel} Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:border-emerald-500/60">
            View notifications
          </button>
          <button
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:border-emerald-500/60"
            onClick={() => router.push(ROUTES.staff)}
          >
            Manage team
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-[2.1fr,1.3fr]">
        {/* LEFT: Snapshot */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Current Facility Snapshot
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                Overview for your currently selected facility.
              </p>
            </div>
            <button
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:border-emerald-500/60"
              onClick={() => router.push(ROUTES.reports)}
            >
              View full report
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {/* Overdue */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium text-slate-300">
                Competencies overdue
              </p>
              <p className="mt-3 text-2xl font-semibold text-red-400">18</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Staff are past due on these items.
              </p>
            </div>

            {/* Due this month */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium text-slate-300">
                Due this month
              </p>
              <p className="mt-3 text-2xl font-semibold text-amber-300">42</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Items coming due in the next 30 days.
              </p>
            </div>

            {/* On track */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium text-slate-300">
                On track
              </p>
              <p className="mt-3 text-2xl font-semibold text-emerald-400">
                86%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Staff who are fully up to date.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT: Quick actions */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Quick actions
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <button
              className="flex w-full items-center justify-between rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              onClick={handleCreateCompetency}
            >
              <span>Create competency</span>
              <span className="text-xs">↗</span>
            </button>

            <button
              className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 hover:border-emerald-500/60"
              onClick={handleAiBuilder}
            >
              <span>AI Builder</span>
              <span className="text-xs text-slate-400">Draft with AI</span>
            </button>

            <button
              className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 hover:border-emerald-500/60"
              onClick={handleAssignCompetencies}
            >
              <span>Assign competencies</span>
              <span className="text-xs text-slate-400">Staff &amp; roles</span>
            </button>

            {/* 🔹 NEW Quick Action: Survey & POCs */}
            <button
              className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 hover:border-emerald-500/60"
              onClick={handleSurveyPocs}
            >
              <span>Survey &amp; POCs</span>
              <span className="text-xs text-slate-400">Tags &amp; corrections</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
