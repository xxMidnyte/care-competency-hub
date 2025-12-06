// app/deficiencies/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import { PlusCircle, Flag, AlertTriangle, CheckCircle2 } from "lucide-react";

type Deficiency = {
  id: string;
  org_id: string;
  facility_id: string | null;
  title: string | null;
  tag_code: string | null;
  severity: string | null;
  scope: string | null;
  deficiency_text: string;
  survey_date: string | null;
  status: string;
};

export default function DeficiencyListPage() {
  const router = useRouter();

  // ---- ORG CONTEXT ----
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasDefModule = org?.featureFlags?.has_deficiency_module ?? false;
  const hasModuleAccess = isDevOrg || hasDefModule;

  const canManage =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  // ---- PAGE STATE ----
  const [loading, setLoading] = useState(true);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Simple derived stats for the header
  const totalCount = deficiencies.length;
  const resolvedCount = deficiencies.filter(
    (d) => d.status?.toLowerCase() === "resolved"
  ).length;
  const openCount = totalCount - resolvedCount;

  // ---- LOAD DATA ----
  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      try {
        setLoading(true);
        setError(null);

        if (!organizationId || !org) {
          setError("Unable to load your organization.");
          return;
        }

        if (!hasModuleAccess) {
          setError(
            "The deficiency module is not enabled for your organization."
          );
          return;
        }

        const {
          data: defRows,
          error: defError,
        } = await supabase
          .from("survey_deficiencies")
          .select("*")
          .eq("org_id", organizationId)
          .order("survey_date", { ascending: false });

        if (defError) {
          console.error(defError);
          setError("Could not load survey deficiencies.");
          return;
        }

        setDeficiencies(defRows ?? []);
      } catch (err) {
        console.error("Deficiency load error:", err);
        setError("Something went wrong loading deficiencies.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, org, organizationId, hasModuleAccess]);

  // ---- HANDLERS ----
  const openNewForm = () => {
    if (!canManage) return;
    router.push("/dashboard/deficiencies/new");
  };

  // Helpers for badges
  const severityBadgeClasses = (severity: string | null) => {
    const s = (severity || "").toLowerCase();

    if (s.includes("immediate") || s.includes("ij")) {
      return "border-rose-500/50 bg-rose-500/10 text-rose-300";
    }
    if (s.includes("high")) {
      return "border-amber-500/50 bg-amber-500/10 text-amber-300";
    }
    if (s.includes("medium")) {
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-200";
    }
    if (s.includes("low")) {
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    }
    return "border-slate-400/40 bg-slate-500/10 text-slate-200";
  };

  const statusBadgeClasses = (status: string) => {
    const s = status.toLowerCase();
    if (s === "resolved" || s === "completed") {
      return "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
    }
    if (s === "in progress" || s === "pending") {
      return "border-sky-500/50 bg-sky-500/10 text-sky-200";
    }
    return "border-slate-500/50 bg-slate-500/10 text-slate-200";
  };

  // ---- LOADING ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-4 h-6 w-48 rounded-full bg-slate-700/30" />
          <div className="mt-4 space-y-3">
            <div className="h-20 w-full rounded-2xl bg-slate-700/20" />
            <div className="h-20 w-full rounded-2xl bg-slate-700/20" />
          </div>
        </div>
      </div>
    );
  }

  // ---- ACCESS ERRORS ----
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            <span>Survey deficiencies</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Survey Deficiencies &amp; POCs
          </h1>
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      </div>
    );
  }

  // ---- MAIN PAGE ----
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* HEADER CARD */}
        <section className="rounded-2xl border border-slate-700/40 bg-[var(--surface)] px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.65)] sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <Flag className="h-3 w-3" />
                <span>Survey deficiencies</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                Survey tags &amp; Plans of Correction
              </h1>
              <p className="text-sm text-slate-400">
                Centralize state survey tags, POCs, and status in one place so
                your next survey isn&apos;t a surprise.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3 text-xs sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 text-[11px]">
                <div className="rounded-lg bg-slate-900/50 px-3 py-1 text-slate-300">
                  <span className="text-xs font-semibold text-emerald-300">
                    {totalCount}
                  </span>{" "}
                  total tags
                </div>
                <div className="rounded-lg bg-slate-900/40 px-3 py-1 text-slate-300">
                  <span className="text-xs font-semibold text-amber-300">
                    {openCount}
                  </span>{" "}
                  open
                </div>
                <div className="hidden rounded-lg bg-slate-900/40 px-3 py-1 text-slate-300 sm:inline-flex">
                  <span className="text-xs font-semibold text-emerald-300">
                    {resolvedCount}
                  </span>{" "}
                  resolved
                </div>
              </div>

              {canManage && (
                <button
                  onClick={openNewForm}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add deficiency
                </button>
              )}
            </div>
          </div>
        </section>

        {/* LIST PANEL */}
        <section className="rounded-2xl border border-slate-700/40 bg-[var(--surface-soft)] p-4 shadow-sm sm:p-5">
          {deficiencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-slate-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-600">
                <Flag className="h-4 w-4 text-slate-500" />
              </div>
              <p className="font-medium text-slate-200">
                No survey deficiencies recorded yet.
              </p>
              <p className="max-w-md text-xs text-slate-400">
                When your next survey hits, log each tag here along with its
                severity, scope, and Plan of Correction so you always know
                what&apos;s outstanding.
              </p>
              {canManage && (
                <button
                  onClick={openNewForm}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add your first deficiency
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-700/40 bg-[var(--surface)]">
              <div className="hidden border-b border-slate-700/60 bg-slate-900/40 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:grid sm:grid-cols-[0.9fr,2fr,1fr,1fr,1fr] sm:gap-2">
                <span>Tag</span>
                <span>Title</span>
                <span>Severity</span>
                <span>Survey date</span>
                <span>Status</span>
              </div>

              <ul className="divide-y divide-slate-700/50">
                {deficiencies.map((d) => (
                  <li
                    key={d.id}
                    className="group grid gap-2 px-3 py-3 text-sm transition hover:bg-slate-900/40 sm:grid-cols-[0.9fr,2fr,1fr,1fr,1fr] sm:items-center sm:gap-2 sm:px-4"
                  >
                    {/* TAG */}
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                      <Link
                        href={`/dashboard/deficiencies/${d.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide hover:border-emerald-300 hover:text-emerald-200"
                      >
                        <Flag className="h-3 w-3" />
                        <span>{d.tag_code || "-"}</span>
                      </Link>
                    </div>

                    {/* TITLE + TEXT SNIPPET */}
                    <div className="space-y-1">
                      <Link
                        href={`/dashboard/deficiencies/${d.id}`}
                        className="line-clamp-1 text-sm font-medium text-[var(--foreground)] hover:underline"
                      >
                        {d.title || "Untitled deficiency"}
                      </Link>
                      <p className="hidden text-xs text-slate-400 sm:line-clamp-1">
                        {d.deficiency_text}
                      </p>
                    </div>

                    {/* SEVERITY */}
                    <div className="text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${severityBadgeClasses(
                          d.severity
                        )}`}
                      >
                        {d.severity || "Not set"}
                      </span>
                    </div>

                    {/* SURVEY DATE */}
                    <div className="text-xs text-slate-400">
                      {d.survey_date || "-"}
                    </div>

                    {/* STATUS */}
                    <div className="flex items-center justify-start text-xs sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClasses(
                          d.status
                        )}`}
                      >
                        {d.status?.toLowerCase() === "resolved" && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {d.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
