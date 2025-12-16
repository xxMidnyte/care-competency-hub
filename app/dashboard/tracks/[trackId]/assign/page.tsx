// app/dashboard/tracks/[trackId]/assign/page.tsx
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
  title: string | null;
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
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | "">("");

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
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) console.error("auth.getUser error:", userErr);

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
        console.error("Profile load error:", profError);
        setError("Unable to load your organization.");
        setLoading(false);
        return;
      }

      const currentOrg = profile.org_id as string;
      setOrgId(currentOrg);

      // Track details
      const { data: trackRow, error: trackError } = await supabase
        .from("tracks")
        .select("id, title, description")
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

    // Prevent duplicates (active assignment exists)
    const { data: existing, error: existErr } = await supabase
      .from("track_assignments")
      .select("id, status")
      .eq("org_id", orgId)
      .eq("track_id", trackId)
      .eq("staff_id", selectedStaffId)
      .in("status", ["assigned", "in_progress"])
      .maybeSingle();

    if (existErr) {
      console.error("Existing assignment check error:", existErr);
      flashMessage("error", "Could not validate existing assignments.");
      setSaving(false);
      return;
    }

    if (existing?.id) {
      flashMessage("error", "This staff member is already assigned to this track.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("track_assignments").insert({
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

    flashMessage(
      "success",
      `Assigned “${track?.title ?? "track"}” to staff member.`
    );
    setSaving(false);
  }

  const pageTitle = track?.title ? `Assign: ${track.title}` : "Assign track";

  return (
    <div className="space-y-6 px-6 py-8">
      {/* Top header with title */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
            Tracks
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-foreground/60">
            Choose a facility and staff member to assign this track.
          </p>
        </div>

        {trackId && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/tracks/${trackId}`)}
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90"
          >
            Back to track
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-foreground/60 shadow-card">
          Loading track details…
        </div>
      ) : (
        <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Facility
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]"
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
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Staff member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={!selectedFacilityId || staff.length === 0}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:ring-2 focus:ring-[color:var(--color-ring)]"
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
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60"
            >
              {saving ? "Assigning…" : "Assign track"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
