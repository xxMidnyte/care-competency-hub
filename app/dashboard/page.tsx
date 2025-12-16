// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Profile = {
  id: string;
  has_completed_onboarding: boolean;
  org_id: string | null;
};

const ROUTES = {
  login: "/login",
  facilities: "/dashboard/facilities",
  staff: "/dashboard/staff",
  assign: "/dashboard/assign",
  reports: "/dashboard/reports",
  createCompetency: "/dashboard/competencies/new",
  aiBuilder: "/dashboard/competencies/ai-builder",
  surveyPocs: "/dashboard/deficiencies",
};

type OnboardingFlags = {
  facility: boolean;
  staff: boolean;
  assign: boolean;
  invite: boolean;
  report: boolean;
};

const chip =
  "rounded-full border border-border bg-muted px-4 py-2 text-[12px] font-medium text-foreground";

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

      if (!user) {
        setRedirecting(true);
        router.replace(ROUTES.login);
        return;
      }

      const meta = (user.user_metadata || {}) as any;
      const role = meta.role || meta.user_role || "Manager";
      setRoleLabel(role);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, has_completed_onboarding, org_id")
        .eq("id", user.id)
        .single();

      const currentProfile: Profile =
        !profileError && profileData
          ? (profileData as Profile)
          : { id: user.id, has_completed_onboarding: false, org_id: null };

      setProfile(currentProfile);

      const orgId = currentProfile.org_id;

      let hasFacility = false;
      let hasStaff = false;

      if (orgId) {
        const { data: facs, error: facError } = await supabase
          .from("facilities")
          .select("id")
          .eq("org_id", orgId)
          .limit(1);

        if (!facError && facs && facs.length > 0) hasFacility = true;

        // ✅ staff_members (not staff)
        const { data: staffRows, error: staffError } = await supabase
          .from("staff_members")
          .select("id")
          .eq("org_id", orgId)
          .limit(1);

        if (!staffError && staffRows && staffRows.length > 0) hasStaff = true;
      }

      const flags: OnboardingFlags = {
        facility: !!orgId && hasFacility,
        staff: !!orgId && hasStaff,
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

      if (currentProfile.has_completed_onboarding) {
        setShowWizard(false);
      } else if (allStepsComplete) {
        await supabase
          .from("profiles")
          .update({ has_completed_onboarding: true })
          .eq("id", currentProfile.id);

        setProfile({ ...currentProfile, has_completed_onboarding: true });
        setShowWizard(false);
      } else {
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

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const allChecklistDone = checklistSteps.every((s) => s.completed);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
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
            }}
          />
        )}

        {!profile?.has_completed_onboarding && !allChecklistDone && (
          <OnboardingChecklist
            steps={checklistSteps}
            onClickContinue={() => setShowWizard(true)}
            onStepClick={handleChecklistStepClick}
          />
        )}

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">
              {roleLabel} Overview
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => {}}>
              View notifications
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(ROUTES.staff)}
            >
              Manage team
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[2.1fr,1.3fr]">
          {/* Snapshot */}
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Current facility snapshot
                </div>
                <div className="text-xs text-muted-foreground">
                  Overview for your currently selected facility.
                </div>
              </div>

              <Button
                variant="secondary"
                size="xs"
                onClick={() => router.push(ROUTES.reports)}
              >
                View full report
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Card className="border-border bg-muted/30 p-4 shadow-none">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Competencies overdue
                </div>
                <div className="mt-3 text-3xl font-semibold text-foreground">
                  18
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Staff are past due on these items.
                </div>
              </Card>

              <Card className="border-border bg-muted/30 p-4 shadow-none">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Due this month
                </div>
                <div className="mt-3 text-3xl font-semibold text-foreground">
                  42
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Items coming due in the next 30 days.
                </div>
              </Card>

              <Card className="border-border bg-muted/30 p-4 shadow-none">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  On track
                </div>
                <div className="mt-3 text-3xl font-semibold text-foreground">
                  86%
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Staff who are fully up to date.
                </div>
              </Card>
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Quick actions
            </div>

            <div className="mt-4 space-y-3">
              <Button
                variant="primary"
                className="w-full justify-between"
                onClick={() => router.push(ROUTES.createCompetency)}
              >
                <span>Create competency</span>
                <span className="text-xs">↗</span>
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => router.push(ROUTES.aiBuilder)}
              >
                <span>AI Builder</span>
                <span className="text-xs text-muted-foreground">Draft with AI</span>
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => router.push(ROUTES.assign)}
              >
                <span>Assign competencies</span>
                <span className="text-xs text-muted-foreground">
                  Staff &amp; roles
                </span>
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => router.push(ROUTES.surveyPocs)}
              >
                <span>Survey &amp; POCs</span>
                <span className="text-xs text-muted-foreground">
                  Tags &amp; corrections
                </span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
