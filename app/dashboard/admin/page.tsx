"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FacilitySnapshotCard } from "./FacilitySnapshotCard";

type Facility = {
  id: string;
  name: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  );
  const [facilityError, setFacilityError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // 1) Auth check
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? null);

      // 2) Get profile for default org
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("default_org_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error", profileError);
      }

      if (!profile?.default_org_id) {
        router.push("/create-org");
        return;
      }

      const orgId = profile.default_org_id as string;
      setOrgId(orgId);

      // 3) Load all facilities for this org
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (facilitiesError) {
        console.error("Facilities error", facilitiesError);
        setFacilityError(
          "Could not load facilities for this organization. Check Supabase data."
        );
        setLoading(false);
        return;
      }

      const facs = (facilitiesData ?? []) as Facility[];
      setFacilities(facs);

      if (!facs.length) {
        setFacilityError(
          "No facilities found for this organization yet. Add a facility to see dashboard data."
        );
        setLoading(false);
        return;
      }

      // 4) Restore last-selected facility from localStorage (if valid)
      let defaultFacilityId: string | null = null;

      if (typeof window !== "undefined") {
        const saved = window.localStorage.getItem("cch:lastFacilityId");
        if (saved && facs.some((f) => f.id === saved)) {
          defaultFacilityId = saved;
        }
      }

      // Fallback to first facility if nothing saved
      if (!defaultFacilityId) {
        defaultFacilityId = facs[0].id;
      }

      setSelectedFacilityId(defaultFacilityId);

      // Persist selection for future visits
      if (typeof window !== "undefined" && defaultFacilityId) {
        window.localStorage.setItem("cch:lastFacilityId", defaultFacilityId);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function handleFacilityChange(id: string) {
    setSelectedFacilityId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cch:lastFacilityId", id);
    }
  }

  if (loading) {
    return <p>Loading dashboard…</p>;
  }

  const selectedFacility =
    facilities.find((f) => f.id === selectedFacilityId) ?? null;

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-300">
            Signed in as {email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Organization ID: {orgId}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-600 px-4 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
        >
          Log out
        </button>
      </div>

      {/* Your three existing tiles */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs uppercase font-semibold text-slate-400">
            Your organization
          </p>
          <p className="mt-2 text-sm text-slate-200">
            You are the owner. Next: invite staff to your org.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs uppercase font-semibold text-slate-400">
            Competencies
          </p>
          <p className="mt-2 text-sm text-slate-200">
            Build CNA/RN/PT competency templates.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs uppercase font-semibold text-slate-400">
            Assignments
          </p>
          <p className="mt-2 text-sm text-slate-200">
            Track overdue and upcoming competencies.
          </p>
        </div>
      </div>

      {/* Facility selector + snapshot */}
      <div className="mt-4 space-y-3">
        {/* Facility selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Facility
            </p>
            <p className="text-xs text-slate-500">
              Choose which building’s compliance you want to view.
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

        {/* Error or snapshot */}
        {facilityError && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100">
            {facilityError}
          </div>
        )}

        {selectedFacility && (
          <FacilitySnapshotCard
            facilityId={selectedFacility.id}
            facilityName={selectedFacility.name ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
