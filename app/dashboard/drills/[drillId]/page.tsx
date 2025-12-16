// app/dashboard/drills/[drillId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import QRCode from "react-qr-code";

type Drill = {
  id: string;
  org_id: string;
  facility_id: string;
  drill_type: string;
  started_at: string;
  ended_at: string | null;
  status: string;
};

type Facility = {
  id: string;
  name: string | null;
};

type Station = {
  id: string;
  name: string;
  order_index: number | null;
};

type Checkin = {
  id: string;
  station_id: string;
  name: string;
  role: string | null;
  timestamp: string;
};

export default function DrillDetailPage() {
  const params = useParams();
  const drillId = params?.drillId as string;

  const router = useRouter();
  const { loading: orgLoading, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drill, setDrill] = useState<Drill | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>("");

  // Capture origin for check-in URLs
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Load drill + stations + checkins
  useEffect(() => {
    if (orgLoading) return;
    if (!organizationId || !drillId) {
      setError("Drill or organization not found.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) Drill
        const { data: drillRow, error: drillError } = await supabase
          .from("drills")
          .select(
            "id, org_id, facility_id, drill_type, started_at, ended_at, status"
          )
          .eq("id", drillId)
          .single();

        if (drillError || !drillRow) {
          console.error("Drill load error:", drillError);
          setError("Unable to load drill.");
          setLoading(false);
          return;
        }

        setDrill(drillRow as Drill);

        // 2) Facility
        const { data: fac, error: facError } = await supabase
          .from("facilities")
          .select("id, name")
          .eq("id", drillRow.facility_id)
          .single();

        if (!facError && fac) {
          setFacility(fac as Facility);
        }

        // 3) Stations
        const { data: stationRows, error: stationError } = await supabase
          .from("drill_stations")
          .select("id, name, order_index")
          .eq("drill_id", drillId)
          .order("order_index", { ascending: true });

        if (stationError) {
          console.error("Stations load error:", stationError);
        }

        setStations(
          (stationRows || []).map((s: any) => ({
            id: s.id,
            name: s.name ?? "Drill station",
            order_index: s.order_index ?? 0,
          }))
        );

        // 4) Checkins
        const { data: checkinRows, error: checkinError } = await supabase
          .from("drill_checkins")
          .select("id, station_id, name, role, timestamp")
          .eq("drill_id", drillId)
          .order("timestamp", { ascending: true });

        if (checkinError) {
          console.error("Checkins load error:", checkinError);
        }

        setCheckins((checkinRows || []) as Checkin[]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, organizationId, drillId]);

  function checkinsForStation(stationId: string) {
    return checkins.filter((c) => c.station_id === stationId);
  }

  async function handleEndDrill() {
    if (!drill || drill.status === "completed") return;

    setSaving(true);
    setError(null);

    try {
      const { data, error: endError } = await supabase
        .from("drills")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", drill.id)
        .select(
          "id, org_id, facility_id, drill_type, started_at, ended_at, status"
        )
        .single();

      if (endError || !data) {
        console.error("End drill error:", endError);
        setError("Unable to end drill.");
        return;
      }

      setDrill(data as Drill);
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = drill
    ? `${drill.drill_type} drill`
    : "Emergency drill details";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Header / back */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/manager")}
              className="mb-2 inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              ← Back to manager dashboard
            </button>
            <h1 className="text-xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
            {facility && (
              <p className="mt-1 text-xs text-slate-400">
                Facility: {facility.name}
              </p>
            )}
          </div>

          {drill && (
            <div className="flex flex-col items-end gap-2">
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    drill.status === "active"
                      ? "bg-sky-500/10 text-sky-300 border border-sky-500/40"
                      : drill.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-700/40 text-slate-200 border border-slate-600/50"
                  }`}
                >
                  {drill.status}
                </span>
              </div>

              <div className="flex gap-2">
                {/* Print station sheets (opens in new tab) */}
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `/dashboard/drills/${drill.id}/print`,
                      "_blank"
                    )
                  }
                  className="inline-flex items-center rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-800"
                >
                  Print station sheets
                </button>

                {/* End drill */}
                {drill.status === "active" && (
                  <button
                    type="button"
                    onClick={handleEndDrill}
                    disabled={saving}
                    className="inline-flex items-center rounded-md bg-red-500/90 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? "Ending…" : "End drill"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-400">Loading drill…</div>
        ) : !drill ? (
          <div className="rounded-md border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">
            Drill not found.
          </div>
        ) : (
          <>
            {/* Drill meta */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Started
                </p>
                <p className="mt-2 text-sm text-slate-100">
                  {drill.started_at
                    ? drill.started_at.slice(0, 16).replace("T", " ")
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ended
                </p>
                <p className="mt-2 text-sm text-slate-100">
                  {drill.ended_at
                    ? drill.ended_at.slice(0, 16).replace("T", " ")
                    : drill.status === "active"
                    ? "In progress"
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total check-ins
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {checkins.length}
                </p>
              </div>
            </div>

            {/* Stations + URLs */}
            <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[var(--surface)] px-4 py-3">
                <div>
                  <h2 className="text-sm font-medium">Stations</h2>
                  <p className="text-xs text-slate-400">
                    One URL per station. Each has a QR code you can print or
                    send directly.
                  </p>
                </div>
              </div>

              {stations.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400">
                  No stations defined for this drill.
                </div>
              ) : (
                <div className="max-h-72 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 border-b border-slate-900/60 bg-[var(--surface)] text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Station
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Check-ins
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Check-in code & URL
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.map((s) => {
                        const list = checkinsForStation(s.id);
                        const url =
                          (baseUrl || "") + `/drills/checkin/${s.id}`;

                        return (
                          <tr
                            key={s.id}
                            className="border-b border-slate-900/60"
                          >
                            <td className="px-4 py-2 align-top text-slate-100">
                              {s.name}
                            </td>
                            <td className="px-4 py-2 align-top text-slate-100">
                              {list.length}
                            </td>
                            <td className="px-4 py-2 align-top text-xs text-slate-300">
                              <div className="flex items-center gap-3">
                                <div className="rounded-md bg-white p-1 shadow-sm">
                                  <QRCode value={url || ""} size={56} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="max-w-xs truncate">
                                    {url}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 align-top text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(url);
                                  } catch {
                                    // ignore
                                  }
                                }}
                                className="inline-flex items-center rounded-md border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100 hover:bg-slate-800"
                              >
                                Copy URL
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Full check-in log */}
            <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[var(--surface)] px-4 py-3">
                <div>
                  <h2 className="text-sm font-medium">Check-in log</h2>
                  <p className="text-xs text-slate-400">
                    Staff who checked in during this drill.
                  </p>
                </div>
              </div>

              {checkins.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400">
                  No check-ins recorded yet.
                </div>
              ) : (
                <div className="max-h-80 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 border-b border-slate-900/60 bg-[var(--surface)] text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Time
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Role
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Station
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkins.map((c) => {
                        const station = stations.find(
                          (s) => s.id === c.station_id
                        );
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-slate-900/60"
                          >
                            <td className="px-4 py-2 align-top text-xs text-slate-300">
                              {c.timestamp
                                ? c.timestamp.slice(0, 16).replace("T", " ")
                                : "—"}
                            </td>
                            <td className="px-4 py-2 align-top text-slate-100">
                              {c.name}
                            </td>
                            <td className="px-4 py-2 align-top text-xs text-slate-300">
                              {c.role || "—"}
                            </td>
                            <td className="px-4 py-2 align-top text-xs text-slate-300">
                              {station?.name || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
