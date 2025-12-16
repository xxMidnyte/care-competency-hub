// app/dashboard/drills/[drillId]/print/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/Card";

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
  drill_id: string;
  station_id: string;
  name: string;
  role: string | null;
  timestamp: string;
};

const ui = {
  shell: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-3xl px-6 pb-10 pt-6",
  topbar: "print-hide mx-auto flex max-w-3xl items-center justify-between px-6 pt-6 pb-2",
  btnSecondary:
    "inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnPrimary:
    "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  loading: "mt-8 text-sm text-foreground/70",
  error: "mt-8 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100",
};

export default function DrillPrintPage() {
  const params = useParams();
  const router = useRouter();
  const drillId = params?.drillId as string;

  const { loading: orgLoading, organizationId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drill, setDrill] = useState<Drill | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setBaseUrl(window.location.origin);
  }, []);

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
        const { data: drillRow, error: drillError } = await supabase
          .from("drills")
          .select("id, org_id, facility_id, drill_type, started_at, ended_at, status")
          .eq("id", drillId)
          .single();

        if (drillError || !drillRow) {
          console.error("Drill load error:", drillError);
          setError("Unable to load drill.");
          setLoading(false);
          return;
        }

        setDrill(drillRow as Drill);

        const { data: fac, error: facError } = await supabase
          .from("facilities")
          .select("id, name")
          .eq("id", drillRow.facility_id)
          .single();

        if (!facError && fac) setFacility(fac as Facility);

        const { data: stationRows, error: stationError } = await supabase
          .from("drill_stations")
          .select("id, name, order_index")
          .eq("drill_id", drillId)
          .order("order_index", { ascending: true });

        if (stationError) console.error("Stations load error:", stationError);

        setStations(
          (stationRows || []).map((s: any) => ({
            id: s.id,
            name: s.name ?? "Drill station",
            order_index: s.order_index ?? 0,
          }))
        );

        const { data: checkinRows, error: checkinError } = await supabase
          .from("drill_checkins")
          .select("id, drill_id, station_id, name, role, timestamp")
          .eq("drill_id", drillId)
          .order("timestamp", { ascending: true });

        if (checkinError) console.error("Checkins load error:", checkinError);

        setCheckins((checkinRows || []) as Checkin[]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, organizationId, drillId]);

  function formatDateTime(value: string | null | undefined) {
    if (!value) return "—";
    return value.slice(0, 16).replace("T", " ");
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    return value.slice(0, 10);
  }

  const totalStations = stations.length;
  const totalCheckins = checkins.length;

  const firstCheckin = checkins.length > 0 ? checkins[0].timestamp : null;
  const lastCheckin =
    checkins.length > 0 ? checkins[checkins.length - 1].timestamp : null;

  const checkinsByStation = stations.reduce<Record<string, number>>((acc, s) => {
    acc[s.id] = checkins.filter((c) => c.station_id === s.id).length;
    return acc;
  }, {});

  return (
    <>
      {/* Print overrides */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header,
          nav,
          aside,
          footer,
          .sidebar-shell,
          .app-shell,
          .app-nav,
          .print-hide {
            display: none !important;
          }
          #drill-print-root {
            margin: 0 !important;
            padding: 0.5in 0.6in !important;
            max-width: none !important;
            width: 100% !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border-color: #dddddd !important;
          }
        }
      `}</style>

      <div id="drill-print-root" className={ui.shell}>
        {/* On-screen controls */}
        <div className={ui.topbar}>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/drills/${drillId}`)}
            className={ui.btnSecondary}
          >
            ← Back to drill
          </button>

          <button type="button" onClick={() => window.print()} className={ui.btnPrimary}>
            Print
          </button>
        </div>

        <main className={ui.wrap}>
          {loading || orgLoading ? (
            <div className={ui.loading}>Preparing print view…</div>
          ) : error ? (
            <div className={ui.error}>{error}</div>
          ) : !drill ? (
            <div className={ui.error}>Drill not found.</div>
          ) : (
            <>
              {/* SUMMARY SHEET */}
              <section className="print-sheet mb-8 rounded-2xl border border-border bg-white px-8 py-6 text-black shadow-card">
                <header className="mb-4 border-b border-black/10 pb-4">
                  <h1 className="text-lg font-semibold tracking-tight">
                    Emergency drill summary report
                  </h1>
                  <p className="mt-1 text-xs text-black/60">
                    {facility?.name ? `Facility: ${facility.name}` : "Facility: —"}
                  </p>
                  <p className="mt-0.5 text-xs text-black/60">
                    Drill type: <span className="font-medium">{drill.drill_type}</span>
                  </p>
                </header>

                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold">Status: </span>
                      <span className="uppercase tracking-wide">{drill.status}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Started: </span>
                      {formatDateTime(drill.started_at)}
                    </div>
                    <div>
                      <span className="font-semibold">Ended: </span>
                      {drill.ended_at ? formatDateTime(drill.ended_at) : "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold">First check-in: </span>
                      {formatDateTime(firstCheckin)}
                    </div>
                    <div>
                      <span className="font-semibold">Last check-in: </span>
                      {formatDateTime(lastCheckin)}
                    </div>
                    <div>
                      <span className="font-semibold">Generated on: </span>
                      {formatDate(new Date().toISOString())}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 text-center text-xs sm:grid-cols-3">
                  <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-black/60">Stations</p>
                    <p className="mt-1 text-2xl font-semibold">{totalStations}</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-black/60">Total check-ins</p>
                    <p className="mt-1 text-2xl font-semibold">{totalCheckins}</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-black/60">Average / station</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {totalStations > 0 ? (totalCheckins / totalStations).toFixed(1) : "0.0"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-black/10">
                  <table className="min-w-full text-xs">
                    <thead className="border-b border-black/10 bg-black/5 text-[11px] uppercase tracking-wide text-black/60">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Station</th>
                        <th className="px-3 py-2 text-right font-medium">Check-ins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-3 py-3 text-sm text-black/60">
                            No drill stations found for this drill.
                          </td>
                        </tr>
                      ) : (
                        stations.map((s) => (
                          <tr key={s.id} className="border-b border-black/5 last:border-0">
                            <td className="px-3 py-2 text-sm">{s.name}</td>
                            <td className="px-3 py-2 text-right text-sm">
                              {checkinsByStation[s.id] ?? 0}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 space-y-5 text-xs text-black/70">
                  <div className="flex gap-8">
                    <div className="flex-1">
                      Supervisor signature:
                      <div className="mt-4 border-b border-black/40" />
                    </div>
                    <div className="w-40">
                      Date:
                      <div className="mt-4 border-b border-black/40" />
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <div className="flex-1">
                      Administrator review:
                      <div className="mt-4 border-b border-black/40" />
                    </div>
                    <div className="w-40">
                      Date:
                      <div className="mt-4 border-b border-black/40" />
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-right text-[10px] text-black/45">
                  Generated by CareCompetencyHub – Emergency Drill Module
                </p>
              </section>

              <div className="my-6 print:my-0" style={{ pageBreakAfter: "always" }} />

              {/* STATION SHEETS */}
              {stations.map((station) => {
                const url = (baseUrl || "") + `/drills/checkin/${station.id}`;

                return (
                  <section
                    key={station.id}
                    className="print-sheet mb-8 rounded-2xl border border-border bg-white px-8 py-6 text-black shadow-card last:mb-0"
                    style={{ pageBreakAfter: "always" }}
                  >
                    <header className="mb-4 border-b border-black/10 pb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/60">
                        Emergency drill station
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">{station.name}</h2>

                      <div className="mt-2 text-[11px] text-black/60 space-y-0.5">
                        <div>
                          <span className="font-semibold">Facility:</span>{" "}
                          {facility?.name || "—"}
                        </div>
                        <div>
                          <span className="font-semibold">Drill:</span> {drill.drill_type}
                        </div>
                        <div>
                          <span className="font-semibold">Drill started:</span>{" "}
                          {formatDateTime(drill.started_at)}
                        </div>
                      </div>
                    </header>

                    <div className="flex flex-col items-center">
                      <div className="rounded-xl border border-black/15 bg-white p-4">
                        <QRCode value={url || ""} size={180} />
                      </div>

                      <p className="mt-4 max-w-md text-center text-[11px] text-black/65">
                        Scan this QR code during the drill to record your check-in at this station.
                      </p>

                      <p className="mt-2 break-all text-center text-[10px] text-black/50">
                        {url}
                      </p>

                      <p className="mt-4 max-w-xl text-[10px] text-black/50">
                        Staff should scan the code using a smartphone camera or QR app. If unable to scan,
                        notify your supervisor so participation can be recorded manually.
                      </p>
                    </div>

                    <div className="mt-8 space-y-4 text-[10px] text-black/60">
                      <div>
                        Notes:
                        <div className="mt-2 h-20 rounded-md border border-dashed border-black/25" />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-6">
                        <div className="flex-1">
                          Staff initials:
                          <div className="mt-3 border-b border-black/40" />
                        </div>
                        <div className="flex-1">
                          Supervisor signature:
                          <div className="mt-3 border-b border-black/40" />
                        </div>
                        <div className="w-32">
                          Time:
                          <div className="mt-3 border-b border-black/40" />
                        </div>
                      </div>
                    </div>

                    <p className="mt-6 text-right text-[10px] text-black/45">
                      Generated by CareCompetencyHub – {formatDate(new Date().toISOString())}
                    </p>
                  </section>
                );
              })}
            </>
          )}
        </main>
      </div>
    </>
  );
}
