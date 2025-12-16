"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { FacilitySnapshotCard } from "@/app/dashboard/FacilitySnapshotCard";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

type Facility = {
  id: string;
  name: string | null;
};

type ManagerStats = {
  activeStaff: number;
  overdue: number;
  dueSoon: number;
};

const LAST_FACILITY_KEY = "cch:manager:lastFacilityId";

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl space-y-6 px-6 py-8",
  kicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-2xl font-semibold tracking-tight",
  p: "text-sm text-foreground/70",
  mini: "text-xs text-foreground/60",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  input:
    "min-w-[240px] rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground shadow-card outline-none transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  statNum: "mt-3 text-3xl font-semibold",
  statHelp: "mt-1 text-xs text-foreground/60",
  msgWarn:
    "rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100",
  msgErr:
    "rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100",
  btnSecondary:
    "inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
};

export default function ManagerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  );

  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<ManagerStats>({
    activeStaff: 0,
    overdue: 0,
    dueSoon: 0,
  });

  // --- Initial load: auth, org, facilities ---
  useEffect(() => {
    async function load() {
      setLoading(true);
      setFacilityError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) console.error("Auth error", authError);

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("default_org_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error", profileError);
        setFacilityError("Unable to load your profile.");
        setLoading(false);
        return;
      }

      if (!profile?.default_org_id) {
        router.push("/create-org");
        return;
      }

      const orgId = profile.default_org_id as string;
      setOrgId(orgId);

      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (facilitiesError) {
        console.error("Facilities error", facilitiesError);
        setFacilityError("Could not load facilities for this organization.");
        setLoading(false);
        return;
      }

      const facs = (facilitiesData ?? []) as Facility[];
      setFacilities(facs);

      if (!facs.length) {
        setFacilityError(
          "No facilities found for this organization yet. Add a facility first."
        );
        setLoading(false);
        return;
      }

      // Restore last manager facility if valid
      let defaultFacilityId: string | null = null;
      if (typeof window !== "undefined") {
        const saved = window.localStorage.getItem(LAST_FACILITY_KEY);
        if (saved && facs.some((f) => f.id === saved)) defaultFacilityId = saved;
      }
      if (!defaultFacilityId) defaultFacilityId = facs[0].id;

      setSelectedFacilityId(defaultFacilityId);

      if (typeof window !== "undefined" && defaultFacilityId) {
        window.localStorage.setItem(LAST_FACILITY_KEY, defaultFacilityId);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  // --- Load manager stats whenever facility changes ---
  useEffect(() => {
    async function loadStats() {
      if (!selectedFacilityId || !orgId) return;

      setStatsLoading(true);
      setStatsError(null);

      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const nowIso = now.toISOString();
      const in30Iso = in30.toISOString();

      try {
        const { count: activeStaffCount, error: staffError } = await supabase
          .from("staff_members")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("facility_id", selectedFacilityId)
          .eq("status", "active");

        if (staffError) throw staffError;

        const { count: overdueCount, error: overdueError } = await supabase
          .from("staff_competencies")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("facility_id", selectedFacilityId)
          .eq("status", "overdue");

        if (overdueError) throw overdueError;

        const { count: dueSoonCount, error: dueSoonError } = await supabase
          .from("staff_competencies")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("facility_id", selectedFacilityId)
          .in("status", ["assigned", "in_progress"])
          .gte("due_at", nowIso)
          .lte("due_at", in30Iso);

        if (dueSoonError) throw dueSoonError;

        setStats({
          activeStaff: activeStaffCount ?? 0,
          overdue: overdueCount ?? 0,
          dueSoon: dueSoonCount ?? 0,
        });
      } catch (err) {
        console.error("Manager stats error", err);
        setStatsError("Unable to load manager stats for this facility.");
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [selectedFacilityId, orgId]);

  function handleFacilityChange(id: string) {
    setSelectedFacilityId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_FACILITY_KEY, id);
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  if (loading) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <p className="text-sm text-foreground/70">Loading manager dashboard…</p>
        </div>
      </div>
    );
  }

  const selectedFacility =
    facilities.find((f) => f.id === selectedFacilityId) ?? null;

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className={ui.kicker}>Manager</p>
            <h1 className={ui.h1}>Manager dashboard</h1>
            <p className={ui.p}>
              Signed in as <span className="font-medium text-foreground">{email}</span>
            </p>
            {orgId && <p className={ui.mini}>Organization ID: {orgId}</p>}
          </div>

          <div className="flex items-center gap-2">
            <ButtonLink href="/dashboard" variant="secondary">
              Back to admin
            </ButtonLink>
          </div>
        </div>

        {/* Facility selector */}
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className={ui.label}>Facility</div>
              <div className="mt-1 text-xs text-foreground/60">
                Choose which building’s team and competencies you want to manage.
              </div>
            </div>

            {facilities.length > 0 && (
              <select
                value={selectedFacilityId ?? ""}
                onChange={(e) => handleFacilityChange(e.target.value)}
                className={ui.input}
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || "Unnamed facility"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </Card>

        {facilityError && <div className={ui.msgWarn}>{facilityError}</div>}

        {/* Stats + actions */}
        {selectedFacility && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-5">
                <div className={ui.label}>Active staff</div>
                <div className={`${ui.statNum} text-foreground`}>
                  {statsLoading ? "…" : stats.activeStaff}
                </div>
                <div className={ui.statHelp}>Staff assigned to this facility.</div>
              </Card>

              <Card className="p-5">
                <div className={ui.label}>Overdue competencies</div>
                <div className={`${ui.statNum} text-red-300`}>
                  {statsLoading ? "…" : stats.overdue}
                </div>
                <div className={ui.statHelp}>
                  Items currently marked overdue for this facility.
                </div>
              </Card>

              <Card className="p-5">
                <div className={ui.label}>Due in next 30 days</div>
                <div className={`${ui.statNum} text-amber-200`}>
                  {statsLoading ? "…" : stats.dueSoon}
                </div>
                <div className={ui.statHelp}>Active assignments coming due soon.</div>
              </Card>

              <Card className="p-5">
                <div className={ui.label}>Quick actions</div>
                <div className="mt-1 text-xs text-foreground/60">
                  Shortcuts managers use every day.
                </div>

                <div className="mt-4 space-y-2">
                  <ButtonLink href="/manager/assign" variant="primary" className="w-full">
                    Assign competencies
                  </ButtonLink>

                  <button type="button" onClick={handlePrint} className={`${ui.btnSecondary} w-full`}>
                    Print snapshot
                  </button>

                  {/* Optional: quick hop into staff/facility screens */}
                  <Link href="/dashboard/staff" className="block text-center text-xs text-primary hover:opacity-90">
                    Manage staff →
                  </Link>
                </div>
              </Card>
            </div>

            {statsError && <div className={ui.msgErr}>{statsError}</div>}

            {/* Snapshot card (your existing component) */}
            <FacilitySnapshotCard
              facilityId={selectedFacility.id}
              facilityName={selectedFacility.name ?? undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
