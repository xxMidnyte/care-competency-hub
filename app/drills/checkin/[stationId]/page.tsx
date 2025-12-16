// app/drills/checkin/[stationId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type StationInfo = {
  id: string;
  name: string;
};

const ui = {
  page: "min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10",
  card: "w-full max-w-md rounded-2xl border border-border bg-card shadow-card p-6",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60",
  title: "text-lg font-semibold tracking-tight",
  sub: "mt-1 text-xs text-foreground/60",
  fieldLabel: "text-xs font-medium text-foreground/60",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  msgErr:
    "rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-foreground",
  msgOk:
    "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-foreground",
  stationBox:
    "rounded-xl border border-border bg-muted/30 px-3 py-2",
  btn:
    "mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
};

export default function DrillCheckinPage() {
  const params = useParams();
  const stationId = params?.stationId as string;

  const [station, setStation] = useState<StationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!name.trim() && !submitting, [name, submitting]);

  // Load station info (just for nicer UI)
  useEffect(() => {
    if (!stationId) return;

    async function loadStation() {
      setLoading(true);

      const { data, error } = await supabase
        .from("drill_stations")
        .select("id, name")
        .eq("id", stationId)
        .maybeSingle();

      if (error) {
        console.error("Drill station load error:", error);
        setStation(null);
      } else if (data) {
        setStation({
          id: data.id,
          name: data.name ?? "Drill station",
        });
      } else {
        setStation(null);
      }

      setLoading(false);
    }

    loadStation();
  }, [stationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/drills/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: stationId,
          name: name.trim(),
          role: role.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        console.error("Check-in error:", json);
        setError(json.error || "Unable to record your check-in.");
      } else {
        setSuccess("Check-in recorded. Thank you!");
        setName("");
        setRole("");
      }
    } catch (err) {
      console.error("Check-in request failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={ui.page}>
      <div className={ui.card}>
        <div className="space-y-1">
          <p className={ui.label}>Emergency drill</p>
          <h1 className={ui.title}>Check-in</h1>
          <p className={ui.sub}>Confirm you participated at this station.</p>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-foreground/60">Loading station…</div>
        ) : !station ? (
          <div className={`mt-6 ${ui.msgErr}`}>
            <p className="font-semibold text-red-500">
              This station link is invalid
            </p>
            <p className="mt-1 text-xs text-foreground/80">
              The drill station may have been deleted or the link was copied incorrectly.
            </p>
          </div>
        ) : (
          <>
            <div className={`mt-5 ${ui.stationBox}`}>
              <p className={ui.label}>Station</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {station.name}
              </p>
            </div>

            {error && (
              <div className={`mt-4 ${ui.msgErr}`}>
                <p className="font-semibold text-red-500">Check-in failed</p>
                <p className="mt-1 text-xs text-foreground/80">{error}</p>
              </div>
            )}

            {success && (
              <div className={`mt-4 ${ui.msgOk}`}>
                <p className="font-semibold text-emerald-500">Success</p>
                <p className="mt-1 text-xs text-foreground/80">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className={ui.fieldLabel}>Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={ui.input}
                  placeholder="First and last name"
                  autoComplete="name"
                  inputMode="text"
                />
              </div>

              <div className="space-y-1">
                <label className={ui.fieldLabel}>Role (optional)</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={ui.input}
                  placeholder="e.g., RN, CNA, LPN"
                  autoComplete="organization-title"
                  inputMode="text"
                />
              </div>

              <button type="submit" disabled={!canSubmit} className={ui.btn}>
                {submitting ? "Recording…" : "Confirm check-in"}
              </button>

              <p className="text-[11px] text-foreground/60">
                If you can’t submit, tell your supervisor and they can record it manually.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
