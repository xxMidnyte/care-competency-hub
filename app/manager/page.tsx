"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { FacilitySnapshotCard } from "@/app/dashboard/FacilitySnapshotCard";

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

      // 1) Auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error", authError);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? null);

      // 2) Profile for org
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

      // 3) Facilities for this org
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
        if (saved && facs.some((f) => f.id === saved)) {
          defaultFacilityId = saved;
        }
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
        // active staff count
        const { count: activeStaffCount, error: staffError } = await supabase
          .from("staff_members")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("facility_id", selectedFacilityId)
          .eq("status", "active");

        if (staffError) throw staffError;

        // overdue competencies
        const { count: overdueCount, error: overdueError } = await supabase
          .from("staff_competencies")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("facility_id", selectedFacilityId)
          .eq("status", "overdue");

        if (overdueError) throw overdueError;

        // due in next 30 days (still assigned / not completed)
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
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-200">
        Loading manager dashboard…
      </p>
    );
  }

  const selectedFacility =
    facilities.find((f) => f.id === selectedFacilityId) ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manager dashboard</h1>
          <p className="text-sm text-slate-300">Signed in as {email}</p>
          {orgId && (
            <p className="mt-1 text-xs text-slate-500">
              Organization ID: {orgId}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            Back to admin
          </Link>
        </div>
      </div>

      {/* Facility selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Facility
          </p>
          <p className="text-xs text-slate-500">
            Choose which building’s team and competencies you want to manage.
          </p>
        </div>

        {facilities.length > 0 && (
          <select
            value={selectedFacilityId ?? ""}
            onChange={(e) => handleFacilityChange(e.target.value)}
            className="min-w-[220px] rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || "Unnamed facility"}
              </option>
            ))}
          </select>
        )}
      </div>

      {facilityError && (
        <div className="rounded-xl border border-amber-500/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          {facilityError}
        </div>
      )}

      {/* Quick stats + actions */}
      {selectedFacility && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Active staff */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">
                Active staff
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-50">
                {statsLoading ? "…" : stats.activeStaff}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Staff assigned to this facility.
              </p>
            </div>

            {/* Overdue */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">
                Overdue competencies
              </p>
              <p className="mt-3 text-2xl font-semibold text-rose-400">
                {statsLoading ? "…" : stats.overdue}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Staff with at least one overdue competency.
              </p>
            </div>

            {/* Due soon */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">
                Due in next 30 days
              </p>
              <p className="mt-3 text-2xl font-semibold text-amber-300">
                {statsLoading ? "…" : stats.dueSoon}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Active assignments coming due soon.
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-400">
                  Quick actions
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Shortcuts managers use every day.
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <Link
                  href="/manager/assign"
                  className="block rounded-full bg-emerald-500 px-4 py-1.5 text-center text-xs font-medium text-slate-950 hover:bg-emerald-400"
                >
                  Assign competencies
                </Link>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
                >
                  Print snapshot
                </button>
              </div>
            </div>
          </div>

          {statsError && (
            <div className="rounded-lg border border-rose-500/60 bg-rose-950/40 px-4 py-3 text-xs text-rose-100">
              {statsError}
            </div>
          )}

          {/* Full facility snapshot (reuse your existing card) */}
          <FacilitySnapshotCard
            facilityId={selectedFacility.id}
            facilityName={selectedFacility.name ?? undefined}
          />
        </>
      )}
    </div>
  );
}
