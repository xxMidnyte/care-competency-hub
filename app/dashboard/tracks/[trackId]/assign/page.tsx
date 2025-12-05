"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Facility = {
  id: string;
  name: string | null;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Track = {
  id: string;
  name: string | null;
  description: string | null;
};

export default function AssignTrackPage() {
  const router = useRouter();
  const params = useParams();
  const trackId = params?.trackId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | "">(
    ""
  );

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | "">("");

  function flashMessage(
    type: "error" | "success",
    message: string,
    timeout = 3000
  ) {
    if (type === "error") {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, timeout);
  }

  // Load org, track, facilities
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profError } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profError || !profile?.org_id) {
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      const currentOrg = profile.org_id as string;
      setOrgId(currentOrg);

      // Track details (adjust table/column names if needed)
      const { data: trackRow, error: trackError } = await supabase
        .from("tracks") // <-- if your table is named differently, change this
        .select("id, name, description")
        .eq("id", trackId)
        .maybeSingle();

      if (trackError || !trackRow) {
        console.error("Track load error:", trackError);
        setError("Unable to load this track.");
        setLoading(false);
        return;
      }

      setTrack(trackRow as Track);

      // Facilities
      const { data: facs, error: facError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", currentOrg)
        .order("name", { ascending: true });

      if (facError) {
        console.error("Facilities load error:", facError);
        setError("Unable to load facilities.");
        setLoading(false);
        return;
      }

      setFacilities(facs || []);
      setLoading(false);
    }

    if (trackId) load();
  }, [router, trackId]);

  // Load staff when facility changes
  useEffect(() => {
    if (!orgId || !selectedFacilityId) return;

    async function loadStaff() {
      setStaff([]);
      setSelectedStaffId("");

      const { data, error } = await supabase
        .from("staff_members")
        .select("id, full_name, email")
        .eq("org_id", orgId)
        .eq("facility_id", selectedFacilityId)
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Staff load error:", error);
        flashMessage("error", "Unable to load staff.");
        return;
      }

      setStaff(data || []);
    }

    loadStaff();
  }, [orgId, selectedFacilityId]);

  async function handleAssignTrack() {
    if (!orgId || !trackId || !selectedFacilityId || !selectedStaffId) return;

    setSaving(true);

    const { error } = await supabase
      .from("track_assignments")
      .insert({
        org_id: orgId,
        facility_id: selectedFacilityId,
        staff_id: selectedStaffId,
        track_id: trackId,
        status: "assigned",
        due_date: null,
        completed_at: null,
      });

    if (error) {
      console.error("Track assign error:", error);
      flashMessage("error", "Error assigning track.");
      setSaving(false);
      return;
    }

    flashMessage("success", "Track assigned to staff member.");
    setSaving(false);
  }

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Assign track
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Assign{" "}
            <span className="font-semibold text-slate-100">
              {track?.name || "this track"}
            </span>{" "}
            to a staff member.
          </p>
        </div>

        {track && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/tracks/${trackId}`)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            Back to track
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-100">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-6 text-sm text-slate-400">
          Loading track details…
        </div>
      ) : (
        <div className="max-w-xl space-y-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-5">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Facility
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select a facility…</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Staff member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={!selectedFacilityId || staff.length === 0}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {!selectedFacilityId ? (
                <option value="">Select a facility first…</option>
              ) : staff.length === 0 ? (
                <option value="">No staff in this facility yet.</option>
              ) : (
                <>
                  <option value="">Select a staff member…</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.email}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={
                saving ||
                !selectedFacilityId ||
                !selectedStaffId ||
                !orgId ||
                !trackId
              }
              onClick={handleAssignTrack}
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-50 shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Assigning…" : "Assign track"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
