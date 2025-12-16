// app/deficiencies/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import {
  PlusCircle,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

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

const ui = {
  page: "min-h-screen bg-background text-foreground",
  container: "mx-auto max-w-6xl space-y-6 px-6 py-8",
  headerKicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-2xl font-semibold tracking-tight",
  p: "text-sm text-foreground/60",
  card: "rounded-2xl border border-border bg-card shadow-card",
  cardSoft: "rounded-2xl border border-border bg-muted/30 shadow-card",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  chip:
    "rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-foreground/80",
  input:
    "w-full rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnSoft:
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  badgeBase:
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
  toastWarn:
    "rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground",
  toastError:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground",
  pill:
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  pillOn: "bg-card text-foreground shadow-sm border border-border",
  pillOff:
    "border border-border bg-background text-foreground/60 hover:bg-muted hover:text-foreground",
};

export default function DeficiencyListPage() {
  const router = useRouter();

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;

  // Back compat: accept both flags
  const hasDefModule =
    (org?.featureFlags as any)?.has_deficiency_module ??
    (org?.featureFlags as any)?.has_survey_shield ??
    false;

  const hasModuleAccess = isDevOrg || !!hasDefModule;

  const canManage =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  const [loading, setLoading] = useState(true);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "in_progress" | "resolved"
  >("all");

  const normalizeStatus = (status: string | null | undefined) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "resolved" || s === "completed" || s === "closed") return "resolved";
    if (s === "in progress" || s === "in_progress" || s === "pending")
      return "in_progress";
    return "open";
  };

  const statusLabel = (status: string | null | undefined) => {
    const s = normalizeStatus(status);
    if (s === "resolved") return "Resolved";
    if (s === "in_progress") return "In progress";
    return "Open";
  };

  const statusBadgeClasses = (status: string | null | undefined) => {
    const s = normalizeStatus(status);
    if (s === "resolved") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    }
    if (s === "in_progress") {
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    }
    return "border-border bg-muted/40 text-foreground/80";
  };

  const severityBadgeClasses = (severity: string | null) => {
    const s = (severity || "").toLowerCase();

    // very forgiving heuristics (you can tighten later)
    if (s.includes("ij") || s.includes("immediate")) {
      return "border-rose-500/30 bg-rose-500/10 text-rose-300";
    }
    if (s.includes("high")) {
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    }
    if (s.includes("medium")) {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
    }
    if (s.includes("low")) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    }

    // letter severities (common: D/E/F... IJ)
    if (/^i?j$/i.test(severity || "")) {
      return "border-rose-500/30 bg-rose-500/10 text-rose-300";
    }

    return "border-border bg-muted/40 text-foreground/80";
  };

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
          setError("The deficiency module is not enabled for your organization.");
          return;
        }

        const { data: defRows, error: defError } = await supabase
          .from("survey_deficiencies")
          .select("*")
          .eq("org_id", organizationId)
          .order("survey_date", { ascending: false });

        if (defError) {
          console.error(defError);
          setError("Could not load survey deficiencies.");
          return;
        }

        setDeficiencies((defRows ?? []) as Deficiency[]);
      } catch (err) {
        console.error("Deficiency load error:", err);
        setError("Something went wrong loading deficiencies.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, org, organizationId, hasModuleAccess]);

  const openNewForm = () => {
    if (!canManage) return;
    router.push("/dashboard/deficiencies/new");
  };

  const totalCount = deficiencies.length;
  const resolvedCount = deficiencies.filter(
    (d) => normalizeStatus(d.status) === "resolved"
  ).length;
  const inProgressCount = deficiencies.filter(
    (d) => normalizeStatus(d.status) === "in_progress"
  ).length;
  const openCount = totalCount - resolvedCount - inProgressCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return deficiencies.filter((d) => {
      const s = normalizeStatus(d.status);
      if (statusFilter !== "all" && s !== statusFilter) return false;

      if (!q) return true;

      const haystack = [
        d.tag_code,
        d.title,
        d.severity,
        d.scope,
        d.deficiency_text,
        d.status,
        d.survey_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [deficiencies, query, statusFilter]);

  if (loading) {
    return (
      <div className={ui.page}>
        <div className={ui.container}>
          <div className="space-y-2">
            <p className={ui.headerKicker}>Survey</p>
            <h1 className={ui.h1}>Survey Deficiencies</h1>
            <p className={ui.p}>Loading…</p>
          </div>

          <div className={`${ui.card} p-5`}>
            <div className="h-10 w-full rounded-xl bg-muted" />
            <div className="mt-4 space-y-3">
              <div className="h-16 w-full rounded-2xl bg-muted" />
              <div className="h-16 w-full rounded-2xl bg-muted" />
              <div className="h-16 w-full rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={ui.page}>
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            <span>Survey deficiencies</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Survey Deficiencies &amp; POCs
          </h1>
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className={ui.headerKicker}>Survey</p>
            <h1 className={ui.h1}>Survey Deficiencies</h1>
            <p className={ui.p}>
              Track tags, Plan of Correction work, and resolution status in one
              place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button onClick={openNewForm} className={ui.btnPrimary}>
                <PlusCircle className="h-4 w-4" />
                Add deficiency
              </button>
            )}
          </div>
        </div>

        {/* Summary + Filters */}
        <div className="grid gap-4 lg:grid-cols-[1.35fr,1fr]">
          <div className={`${ui.card} p-5`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={ui.chip}>
                <span className="font-semibold text-foreground">{totalCount}</span>{" "}
                total
              </span>
              <span className={ui.chip}>
                <span className="font-semibold text-foreground">{openCount}</span>{" "}
                open
              </span>
              <span className={ui.chip}>
                <span className="font-semibold text-foreground">
                  {inProgressCount}
                </span>{" "}
                in progress
              </span>
              <span className={ui.chip}>
                <span className="font-semibold text-foreground">
                  {resolvedCount}
                </span>{" "}
                resolved
              </span>
            </div>

            {!canManage && (
              <div className="mt-4">
                <div className={ui.toastWarn}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                    <div>
                      <div className="font-semibold">Read-only access</div>
                      <div className="mt-1 text-xs text-foreground/80">
                        You can view deficiencies, but only admins/managers can
                        add or edit items.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`${ui.card} p-5 space-y-3`}>
            <div className="space-y-1">
              <div className={ui.label}>Search</div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tag, title, severity, text…"
                  className={`${ui.input} pl-9 pr-9`}
                />
                {query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-foreground/60 hover:bg-muted"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className={ui.label}>Status</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "open", label: "Open" },
                  { key: "in_progress", label: "In progress" },
                  { key: "resolved", label: "Resolved" },
                ].map((s) => {
                  const active = statusFilter === (s.key as any);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() =>
                        setStatusFilter(
                          s.key as "all" | "open" | "in_progress" | "resolved"
                        )
                      }
                      className={`${ui.pill} ${active ? ui.pillOn : ui.pillOff}`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <section className={ui.card}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-semibold">Deficiencies</div>
              <div className="mt-1 text-xs text-foreground/60">
                {filtered.length} item{filtered.length === 1 ? "" : "s"} shown
              </div>
            </div>

            <div className="text-xs text-foreground/60">
              <span className="inline-flex items-center gap-1">
                <Flag className="h-3.5 w-3.5" />
                Tag
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border">
                <Flag className="h-5 w-5 text-foreground/40" />
              </div>
              <div className="mt-3 text-sm font-semibold">No results</div>
              <div className="mt-1 text-xs text-foreground/60">
                Try a different search or switch the status filter.
              </div>

              {canManage && (
                <div className="mt-4">
                  <button onClick={openNewForm} className={ui.btnPrimary}>
                    <PlusCircle className="h-4 w-4" />
                    Add deficiency
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((d) => (
                <li key={d.id} className="group px-5 py-4 hover:bg-muted/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/deficiencies/${d.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary hover:opacity-90"
                        >
                          <Flag className="h-3 w-3" />
                          <span>{d.tag_code || "—"}</span>
                        </Link>

                        <span
                          className={`${ui.badgeBase} ${severityBadgeClasses(
                            d.severity
                          )}`}
                        >
                          {d.severity || "Severity: not set"}
                        </span>

                        <span
                          className={`${ui.badgeBase} ${statusBadgeClasses(
                            d.status
                          )}`}
                        >
                          {normalizeStatus(d.status) === "resolved" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {statusLabel(d.status)}
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/deficiencies/${d.id}`}
                        className="block min-w-0 truncate text-sm font-semibold text-foreground hover:underline"
                        title={d.title || ""}
                      >
                        {d.title || "Untitled deficiency"}
                      </Link>

                      {d.deficiency_text && (
                        <p className="line-clamp-2 text-xs text-foreground/60">
                          {d.deficiency_text}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs text-foreground/60 sm:flex-col sm:items-end sm:gap-1">
                      <div className="text-foreground/60">
                        Survey date{" "}
                        <span className="font-semibold text-foreground">
                          {d.survey_date || "—"}
                        </span>
                      </div>

                      <div className="text-foreground/50">
                        Scope{" "}
                        <span className="font-semibold text-foreground/80">
                          {d.scope || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
