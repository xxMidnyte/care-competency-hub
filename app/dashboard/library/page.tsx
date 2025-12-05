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

  if (v === "critical") {
    return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
  }
  if (v === "high") {
    return "bg-red-500/20 text-red-300 border border-red-500/40";
  }
  if (v === "medium") {
    return "bg-yellow-500/15 text-yellow-200 border border-yellow-500/30";
  }
  // default low / unknown
  return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
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

      const { data, error: compError } = await supabase
        .from("competency_templates")
        .select(
          "id, title, risk, roles, setting, language, created_at, org_id"
        )
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
      setLoading(false);
    }

    load();
  }, [orgLoading, organizationId]);

  const hasCompetencies = competencies.length > 0;

  // ---- Derived filter option helpers (so filters only show values in use) ----
  const usedRoles = useMemo(() => {
    const set = new Set<string>();
    competencies.forEach((c) => {
      (c.roles || []).forEach((r) => set.add(r));
    });
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

  // ---- Filtered list ----
  const filteredCompetencies = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    return competencies.filter((c) => {
      const risk = (c.risk || "").toLowerCase();
      const roles = (c.roles as string[]) || [];
      const setting = (c.setting as string) || "";
      const language = (c.language as string) || "";

      // Search in title + tags
      if (searchLower) {
        const haystack = [
          c.title || "",
          roles.join(" "),
          setting,
          language,
          risk,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchLower)) return false;
      }

      // Risk filter
      if (riskFilter !== "All") {
        if (risk !== riskFilter.toLowerCase()) return false;
      }

      // Role filter
      if (roleFilter !== "All roles") {
        if (!roles.includes(roleFilter)) return false;
      }

      // Setting filter
      if (settingFilter !== "All settings") {
        if (setting !== settingFilter) return false;
      }

      // Language filter
      if (languageFilter !== "all") {
        if (language !== languageFilter) return false;
      }

      return true;
    });
  }, [
    competencies,
    search,
    riskFilter,
    roleFilter,
    settingFilter,
    languageFilter,
  ]);

  const hasFiltered = filteredCompetencies.length > 0;

  const handleClearFilters = () => {
    setSearch("");
    setRiskFilter("All");
    setRoleFilter("All roles");
    setSettingFilter("All settings");
    setLanguageFilter("all");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Competency library
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              All competencies created for{" "}
              <span className="font-medium text-slate-200">
                {organizationId ? "your organization." : "shared templates."}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/competencies/ai-builder")
            }
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            <span className="text-lg">✨</span>
            <span>New with AI</span>
          </button>
        </header>

        {/* FILTER BAR */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Search
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1.5">
                <span className="text-xs text-slate-500">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, role, setting, or language…"
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Clear */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="self-start text-xs text-slate-400 hover:text-slate-200 md:self-end"
            >
              Clear filters
            </button>
          </div>

          {/* Chips / dropdown filters */}
          <div className="grid gap-3 md:grid-cols-4">
            {/* Risk */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Risk
              </label>
              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(e.target.value as (typeof RISK_OPTIONS)[number])
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
              >
                {RISK_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
              >
                <option value="All roles">All roles</option>
                {(usedRoles.length > 0 ? usedRoles : ROLE_OPTIONS).map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Setting */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Setting
              </label>
              <select
                value={settingFilter}
                onChange={(e) => setSettingFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
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
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Language
              </label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
                {/* If you have any non-standard languages in data, surface them */}
                {usedLanguages
                  .filter(
                    (code) =>
                      !LANGUAGE_OPTIONS.some((l) => l.value === code)
                  )
                  .map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </section>

        {/* STATES */}
        {loading && (
          <p className="text-sm text-slate-400">Loading competencies…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && !hasCompetencies && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
            <p className="font-medium text-slate-200">
              No competencies in your library yet.
            </p>
            <p className="mt-1">
              Use the{" "}
              <span className="font-medium text-emerald-300">
                New with AI
              </span>{" "}
              button to generate your first template.
            </p>
          </div>
        )}

        {/* LIST */}
        {!loading && !error && hasCompetencies && (
          <>
            {!hasFiltered && (
              <p className="text-xs text-slate-400">
                No competencies match your filters. Try clearing them.
              </p>
            )}

            {hasFiltered && (
              <div className="space-y-4">
                {filteredCompetencies.map((c) => {
                  const risk = c.risk || "low";
                  const created = c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "";

                  const roles: string[] = (c.roles as string[]) || [];
                  const settings: string[] = c.setting
                    ? [c.setting as string]
                    : [];
                  const language = (c.language as string) || "";
                  const tags: string[] = [
                    ...roles,
                    ...settings,
                    ...(language ? [language] : []),
                  ];

                  return (
                    <div
                      key={c.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between"
                    >
                      {/* Left: title + tags */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-sm font-semibold text-slate-50">
                            {c.title || "Untitled competency"}
                          </h2>

                          <div
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${riskBadgeClasses(
                              risk
                            )}`}
                          >
                            <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
                              Risk:
                            </span>
                            <span>{risk}</span>
                          </div>
                        </div>

                        {tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: created + actions */}
                      <div className="flex items-center gap-4 md:ml-6">
                        <div className="hidden text-xs text-slate-400 sm:block text-right">
                          {created && (
                            <>
                              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                Created
                              </div>
                              <div>{created}</div>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/dashboard/library/${c.id}`)
                            }
                            className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-slate-400"
                          >
                            View
                          </button>

                          {canAssign && (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/library/${c.id}?mode=assign`
                                )
                              }
                              className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                            >
                              Use
                            </button>
                          )}
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
