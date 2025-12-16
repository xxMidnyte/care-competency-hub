// app/dashboard/library/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type CompetencyTemplate = {
  id: string;
  title: string | null;
  risk: string | null;
  roles: string[] | null;
  setting: string | null;
  language: string | null;
  created_at: string;
  org_id?: string | null;
  [key: string]: any;
};

function riskBadgeClasses(risk: string | null | undefined) {
  const v = (risk || "").toLowerCase();
  if (v === "critical") return "bg-red-500/10 text-red-300 border border-red-500/30";
  if (v === "high") return "bg-orange-500/10 text-orange-300 border border-orange-500/30";
  if (v === "medium") return "bg-yellow-500/10 text-yellow-200 border border-yellow-500/30";
  return "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30";
}

// Static options (mirrors AI builder)
const ROLE_OPTIONS = [
  "RN",
  "LPN / LVN",
  "CNA",
  "PT",
  "OT",
  "SLP",
  "Home Health Aide",
  "Respiratory Therapist",
  "Office Staff",
];

const SETTING_OPTIONS = [
  "Home Health",
  "LTC / Assisted Living",
  "Acute Care",
  "Outpatient",
  "Hospice",
  "Clinic",
];

const RISK_OPTIONS = ["All", "Low", "Medium", "High", "Critical"] as const;

const LANGUAGE_OPTIONS = [
  { value: "all", label: "All languages" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "so", label: "Somali" },
  { value: "hmn", label: "Hmong" },
];

// Shared UI primitives (same style as the other tokenized pages)
const card = "rounded-2xl border border-border bg-card shadow-card";
const label =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const select =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const chip =
  "rounded-full bg-muted px-2 py-1 text-[11px] text-foreground/70";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

export default function CompetencyLibraryPage() {
  const router = useRouter();

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";
  const canAssign =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState<CompetencyTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] =
    useState<(typeof RISK_OPTIONS)[number]>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All roles");
  const [settingFilter, setSettingFilter] = useState<string>("All settings");
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      setLoading(true);
      setError(null);

      if (!organizationId) {
        setError("Unable to load organization.");
        setCompetencies([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: compError } = await supabase
          .from("competency_templates")
          .select("id, title, risk, roles, setting, language, created_at, org_id")
          .eq("org_id", organizationId)
          .order("created_at", { ascending: false });

        if (compError) {
          console.error(compError);
          setError("Unable to load competencies.");
          setCompetencies([]);
          setLoading(false);
          return;
        }

        setCompetencies((data as CompetencyTemplate[]) || []);
      } catch (e) {
        console.error("Library load crash:", e);
        setError("Unexpected error loading competencies.");
        setCompetencies([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, organizationId]);

  const hasCompetencies = competencies.length > 0;

  // Derived filter option helpers
  const usedRoles = useMemo(() => {
    const set = new Set<string>();
    competencies.forEach((c) => (c.roles || []).forEach((r) => r && set.add(r)));
    return Array.from(set).sort();
  }, [competencies]);

  const usedSettings = useMemo(() => {
    const set = new Set<string>();
    competencies.forEach((c) => {
      if (c.setting) set.add(c.setting);
    });
    return Array.from(set).sort();
  }, [competencies]);

  const usedLanguages = useMemo(() => {
    const set = new Set<string>();
    competencies.forEach((c) => {
      if (c.language) set.add(c.language);
    });
    return Array.from(set).sort();
  }, [competencies]);

  // Filtered list
  const filteredCompetencies = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    return competencies.filter((c) => {
      const risk = (c.risk || "").toLowerCase();
      const roles = (c.roles as string[]) || [];
      const setting = (c.setting as string) || "";
      const language = (c.language as string) || "";

      if (searchLower) {
        const haystack = [c.title || "", roles.join(" "), setting, language, risk]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }

      if (riskFilter !== "All" && risk !== riskFilter.toLowerCase()) return false;
      if (roleFilter !== "All roles" && !roles.includes(roleFilter)) return false;
      if (settingFilter !== "All settings" && setting !== settingFilter) return false;
      if (languageFilter !== "all" && language !== languageFilter) return false;

      return true;
    });
  }, [competencies, search, riskFilter, roleFilter, settingFilter, languageFilter]);

  const hasFiltered = filteredCompetencies.length > 0;

  const handleClearFilters = () => {
    setSearch("");
    setRiskFilter("All");
    setRoleFilter("All roles");
    setSettingFilter("All settings");
    setLanguageFilter("all");
  };

  const filtersActive =
    !!search.trim() ||
    riskFilter !== "All" ||
    roleFilter !== "All roles" ||
    settingFilter !== "All settings" ||
    languageFilter !== "all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Competency library
            </h1>
            <p className="mt-1 text-sm text-foreground/60">
              All competencies created for{" "}
              <span className="font-medium text-foreground">
                {organizationId ? "your organization." : "shared templates."}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/competencies/ai-builder")}
            className={btnPrimary}
          >
            <span className="mr-2 text-base">✨</span>
            New with AI
          </button>
        </header>

        {/* FILTER BAR */}
        <section className={`${card} p-4 space-y-4`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            {/* Search */}
            <div className="flex-1 space-y-1">
              <label className={label}>Search</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <span className="text-xs text-foreground/50">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, role, setting, or language…"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
                />
              </div>
            </div>

            {/* Clear */}
            <button type="button" onClick={handleClearFilters} className={btnSoft}>
              Clear
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {/* Risk */}
            <div className="space-y-1">
              <label className={label}>Risk</label>
              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(e.target.value as (typeof RISK_OPTIONS)[number])
                }
                className={select}
              >
                {RISK_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className={label}>Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={select}
              >
                <option value="All roles">All roles</option>
                {(usedRoles.length > 0 ? usedRoles : ROLE_OPTIONS).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Setting */}
            <div className="space-y-1">
              <label className={label}>Setting</label>
              <select
                value={settingFilter}
                onChange={(e) => setSettingFilter(e.target.value)}
                className={select}
              >
                <option value="All settings">All settings</option>
                {(usedSettings.length > 0 ? usedSettings : SETTING_OPTIONS).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1">
              <label className={label}>Language</label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className={select}
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
                {usedLanguages
                  .filter((code) => !LANGUAGE_OPTIONS.some((l) => l.value === code))
                  .map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-foreground/60">
              Showing{" "}
              <span className="font-semibold text-foreground">{filteredCompetencies.length}</span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">{competencies.length}</span>
            </p>
            {filtersActive && <span className={chip}>Filters active</span>}
          </div>
        </section>

        {/* STATES */}
        {loading && <p className="text-sm text-foreground/60">Loading competencies…</p>}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !hasCompetencies && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-foreground/60">
            <p className="font-semibold text-foreground">No competencies in your library yet.</p>
            <p className="mt-1">
              Use <span className="font-semibold text-primary">New with AI</span> to generate your first template.
            </p>
          </div>
        )}

        {/* LIST */}
        {!loading && !error && hasCompetencies && (
          <>
            {!hasFiltered && (
              <p className="text-sm text-foreground/60">
                No competencies match your filters. Try clearing them.
              </p>
            )}

            {hasFiltered && (
              <div className="space-y-3">
                {filteredCompetencies.map((c) => {
                  const risk = c.risk || "low";
                  const created = c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "";

                  const roles: string[] = (c.roles as string[]) || [];
                  const settings: string[] = c.setting ? [c.setting as string] : [];
                  const language = (c.language as string) || "";
                  const tags: string[] = [...roles, ...settings, ...(language ? [language] : [])];

                  return (
                    <div key={c.id} className={`${card} p-4`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        {/* Left */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold">
                              {c.title || "Untitled competency"}
                            </h2>

                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${riskBadgeClasses(
                                risk
                              )}`}
                            >
                              <span className="mr-1 text-[10px] uppercase tracking-wide text-foreground/50">
                                Risk
                              </span>
                              {risk}
                            </span>
                          </div>

                          {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <span key={tag} className={chip}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-3 md:justify-end">
                          <div className="hidden sm:block text-right">
                            <div className={label}>Created</div>
                            <div className="text-sm text-foreground/70">{created || "—"}</div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/dashboard/library/${c.id}`)}
                              className={btnSoft}
                            >
                              View
                            </button>

                            {canAssign && (
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/library/${c.id}?mode=assign`)}
                                className={btnPrimary}
                              >
                                Use
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
