// app/dashboard/facilities/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Facility = {
  id: string;
  name: string | null;
  city?: string | null;
  state?: string | null;
  beds?: number | null;
};

const CURRENT_FACILITY_KEY = "cch_current_facility_id";

export default function FacilitiesPage() {
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasFacilityModule = org?.featureFlags?.has_facility_module ?? true; // default true so it doesn't block you yet
  const hasModuleAccess = isDevOrg || hasFacilityModule;

  const canManageFacilities =
    userRole === "dev" || userRole === "admin";

  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [currentFacilityId, setCurrentFacilityId] = useState<string | null>(
    null
  );

  // create-facility UI state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newBeds, setNewBeds] = useState<string>("");

  // delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasFacilities = facilities.length > 0;

  useEffect(() => {
    async function load() {
      try {
        if (orgLoading) return;

        setLoading(true);
        setError(null);

        if (!organizationId || !org) {
          setError("Unable to load your organization.");
          setLoading(false);
          return;
        }

        if (!hasModuleAccess) {
          setError(
            "The facilities module is not enabled for your organization yet."
          );
          setLoading(false);
          return;
        }

        // 1) load facilities for this org
        const { data, error: facError } = await supabase
          .from("facilities")
          .select("id, name, city, state, beds")
          .eq("org_id", organizationId)
          .order("name", { ascending: true });

        if (facError) {
          console.error(facError);
          setError("Unable to load facilities.");
          setLoading(false);
          return;
        }

        setFacilities((data as Facility[]) || []);

        // 2) load current facility from localStorage (if any)
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem(CURRENT_FACILITY_KEY);
          if (stored) {
            setCurrentFacilityId(stored);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading facilities.");
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, org, organizationId, hasModuleAccess]);

  function handleSetCurrent(facilityId: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENT_FACILITY_KEY, facilityId);
    }
    setCurrentFacilityId(facilityId);
  }

  async function handleCreateFacility() {
    setError(null);

    if (!organizationId) {
      setError("Missing organization context.");
      return;
    }

    if (!canManageFacilities) {
      setError("You do not have permission to create facilities.");
      return;
    }

    if (!newName.trim()) {
      setError("Facility name is required.");
      return;
    }

    setCreating(true);

    const { data, error: createError } = await supabase
      .from("facilities")
      .insert({
        org_id: organizationId,
        name: newName.trim(),
        city: newCity.trim() || null,
        state: newState.trim() || null,
        beds: newBeds ? Number(newBeds) : null,
      })
      .select("id, name, city, state, beds")
      .single();

    setCreating(false);

    if (createError) {
      console.error(createError);
      setError("Unable to create facility.");
      return;
    }

    const newFac = data as Facility;
    setFacilities((prev) =>
      [...prev, newFac].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      )
    );

    setNewName("");
    setNewCity("");
    setNewState("");
    setNewBeds("");
    setShowCreate(false);
  }

  async function handleDeleteFacility(id: string) {
    if (!canManageFacilities) {
      // Safety: UI already hides this
      return;
    }

    setError(null);

    const target = facilities.find((f) => f.id === id);
    const label = target?.name || "this facility";

    const ok = window.confirm(
      `Are you sure you want to delete "${label}"?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setDeletingId(id);

    const { error: delError } = await supabase
      .from("facilities")
      .delete()
      .eq("id", id)
      .eq("org_id", organizationId);

    setDeletingId(null);

    if (delError) {
      console.error(delError);
      setError(
        delError.code === "23503"
          ? "Cannot delete this facility because it has related data (staff/assignments)."
          : "Unable to delete facility."
      );
      return;
    }

    setFacilities((prev) => prev.filter((f) => f.id !== id));

    if (currentFacilityId === id) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CURRENT_FACILITY_KEY);
      }
      setCurrentFacilityId(null);
    }
  }

  // ---- HARD ERRORS (no org / no module) ----
  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="p-6 text-sm text-slate-400">Loading facilities…</div>
      </div>
    );
  }

  if (error && (!hasModuleAccess || !organizationId)) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6 max-w-3xl space-y-3">
          <h1 className="text-xl font-semibold">Facilities</h1>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ---- MAIN UI ----
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Facilities
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage the facilities in your organization and who is responsible
              for each one.
            </p>
          </div>

          {canManageFacilities && (
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              {showCreate ? "Cancel" : "Add facility"}
            </button>
          )}
        </div>

        {/* Create facility card */}
        {showCreate && canManageFacilities && (
          <div className="mt-2 rounded-2xl border border-slate-800 bg-[var(--surface-soft)] p-4 text-sm">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Create facility
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Add a new facility to your organization. You can assign staff and
              competencies to it later.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Facility name
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-emerald-500"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. West Wing Care Center"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  City
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-emerald-500"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="St. Cloud"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  State
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-emerald-500"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="MN"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Beds (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-emerald-500"
                  value={newBeds}
                  onChange={(e) => setNewBeds(e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {error && (
                <p className="text-xs text-red-400">
                  {error}
                </p>
              )}
              <button
                onClick={handleCreateFacility}
                disabled={creating}
                className="ml-auto rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {creating ? "Saving…" : "Save facility"}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-4">
          {!loading && !showCreate && error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && !hasFacilities && !showCreate && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[var(--surface-soft)] p-6 text-sm text-slate-400">
              <p className="font-medium text-[var(--foreground)]">
                No facilities found for this organization.
              </p>
              <p className="mt-1">
                {canManageFacilities ? (
                  <>
                    Use the{" "}
                    <span className="font-medium">Add facility</span> button to
                    create your first location. You can assign staff and
                    competencies to a facility once it&apos;s created.
                  </>
                ) : (
                  "An administrator can add facilities for your organization."
                )}
              </p>
            </div>
          )}

          {hasFacilities && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {facilities.map((fac) => {
                const isCurrent = fac.id === currentFacilityId;
                const isDeleting = deletingId === fac.id;

                return (
                  <div
                    key={fac.id}
                    className="group relative rounded-2xl border border-slate-800 bg-[var(--surface-soft)] p-4 text-sm"
                  >
                    {/* Hover delete (admin/dev only) */}
                    {canManageFacilities && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFacility(fac.id)}
                        disabled={isDeleting}
                        className="absolute right-3 top-3 rounded-full bg-[var(--surface)] p-1 text-xs text-slate-400 opacity-0 shadow-sm transition-all group-hover:-translate-y-1 group-hover:opacity-100 hover:text-red-400 disabled:cursor-not-allowed"
                        title="Delete facility"
                      >
                        {isDeleting ? "…" : "🗑"}
                      </button>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {fac.name || "Untitled facility"}
                        </p>
                        {(fac.city || fac.state) && (
                          <p className="text-xs text-slate-400">
                            {[fac.city, fac.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      {typeof fac.beds === "number" && (
                        <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] text-slate-400">
                          {fac.beds} beds
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Managers &amp; staff assignments coming soon</span>
                      <button
                        onClick={() => handleSetCurrent(fac.id)}
                        className={`rounded-full border px-2 py-1 text-[11px] ${
                          isCurrent
                            ? "border-emerald-500/80 text-emerald-300 bg-emerald-500/10"
                            : "border-slate-700 text-slate-200 hover:border-emerald-500/60"
                        }`}
                      >
                        {isCurrent ? "Current facility" : "Set as current"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
