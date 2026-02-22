// app/dashboard/library/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

const LIBRARY_ORG_ID = "00000000-0000-0000-0000-000000000001";

type CompetencyTemplate = {
  id: string;
  title: string | null;
  risk: string | null;
  roles: string[] | null;
  setting: string | null;
  language: string | null;
  created_at: string;
  org_id?: string | null;
  content?: any;
  [key: string]: any;
};

function riskBadgeClasses(risk: string | null | undefined) {
  const v = (risk || "").toLowerCase();
  if (v === "critical")
    return "bg-red-500/10 text-red-300 border border-red-500/30";
  if (v === "high")
    return "bg-orange-500/10 text-orange-300 border border-orange-500/30";
  if (v === "medium")
    return "bg-yellow-500/10 text-yellow-200 border border-yellow-500/30";
  return "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30";
}

function sourceBadgeClasses(source: "CCH Library" | "Your org") {
  return source === "CCH Library"
    ? "bg-sky-500/10 text-sky-200 border border-sky-500/30"
    : "bg-primary/10 text-primary border border-primary/30";
}

function normalizeRoleLabel(r: string) {
  const v = (r || "").toLowerCase();
  if (v === "lpn" || v.includes("lpn")) return "LPN";
  if (v === "rn") return "RN";
  if (v === "cna") return "CNA";
  return r;
}

// ---- Meta extraction helpers ----
type Meta = {
  tier?: string | null;
  evidence?: string | null;
  reassignment?: string | null;
};

function safeParseContent(raw: any): any {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { content: raw };
    }
  }
  return { content: String(raw) };
}

function firstLine(s: string, max = 42) {
  const line = (s || "").split("\n")[0].trim();
  if (!line) return "";
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function extractMeta(rawContent: any): Meta {
  const c = safeParseContent(rawContent) || {};
  const meta = c?.meta && typeof c.meta === "object" ? c.meta : {};

  const tier = meta.tier ?? c.tier ?? c.category ?? c.level ?? null;

  const evidence =
    meta.evidence ??
    meta.evidence_requirements ??
    c.evidence ??
    c["evidence requirements"] ??
    c.evidence_requirements ??
    c.evidenceRequirements ??
    null;

  const reassignment =
    meta.reassignment ??
    meta.reassign ??
    meta.frequency ??
    meta.interval ??
    c.reassignment ??
    c.reassign ??
    c.frequency ??
    c.interval ??
    c.reassignment_interval ??
    c.reassignmentInterval ??
    null;

  return {
    tier: tier ? String(tier) : null,
    evidence: evidence ? String(evidence) : null,
    reassignment: reassignment ? String(reassignment) : null,
  };
}

// Static options (fallback)
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
  "LTC / Assisted Living",
  "Home Health",
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

const SOURCE_OPTIONS = ["All", "CCH Library", "Your org"] as const;

// Shared UI primitives
const card = "rounded-2xl border border-border bg-card shadow-card";
const label =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const select =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const chip = "rounded-full bg-muted px-2 py-1 text-[11px] text-foreground/70";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const pill =
  "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const pillActive =
  "bg-primary text-primary-foreground border-primary/40 hover:opacity-95";

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
  const [sourceFilter, setSourceFilter] =
    useState<(typeof SOURCE_OPTIONS)[number]>("All");

  const quickRoles = ["CNA", "LPN", "RN"] as const;

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
          .select("id, title, risk, roles, setting, language, created_at, org_id, content")
          .or(`org_id.eq.${LIBRARY_ORG_ID},org_id.eq.${organizationId}`)
          .order("created_at", { ascending: false });

        if (compError) {
          console.error(compError);
          setError("Unable to load library competencies.");
          setCompetencies([]);
          setLoading(false);
          return;
        }

        setCompetencies((data as CompetencyTemplate[]) || []);
      } catch (e) {
        console.error("Library load crash:", e);
        setError("Unexpected error loading library.");
        setCompetencies([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, organizationId]);

  const hasCompetencies = competencies.length > 0;

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

  const filteredCompetencies = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    return competencies.filter((c) => {
      const risk = (c.risk || "").toLowerCase();
      const roles = (c.roles as string[]) || [];
      const setting = (c.setting as string) || "";
      const language = (c.language as string) || "";
      const source: "CCH Library" | "Your org" =
        c.org_id === LIBRARY_ORG_ID ? "CCH Library" : "Your org";

      if (searchLower) {
        const meta = extractMeta(c.content);
        const haystack = [
          c.title || "",
          roles.join(" "),
          setting,
          language,
          risk,
          meta.tier || "",
          meta.evidence || "",
          meta.reassignment || "",
          source,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchLower)) return false;
      }

      if (riskFilter !== "All" && risk !== riskFilter.toLowerCase()) return false;

      if (roleFilter !== "All roles") {
        const normalized = roles.map(normalizeRoleLabel);
        const want = normalizeRoleLabel(roleFilter);
        if (!roles.includes(roleFilter) && !normalized.includes(want)) return false;
      }

      if (settingFilter !== "All settings" && setting !== settingFilter) return false;
      if (languageFilter !== "all" && language !== languageFilter) return false;
      if (sourceFilter !== "All" && source !== sourceFilter) return false;

      return true;
    });
  }, [
    competencies,
    search,
    riskFilter,
    roleFilter,
    settingFilter,
    languageFilter,
    sourceFilter,
  ]);

  const counts = useMemo(() => {
    const byRole = { CNA: 0, LPN: 0, RN: 0 };
    const bySource = { library: 0, org: 0 };

    filteredCompetencies.forEach((c) => {
      const roles = (c.roles as string[]) || [];
      const normalized = roles.map(normalizeRoleLabel);
      if (normalized.includes("CNA")) byRole.CNA += 1;
      if (normalized.includes("LPN")) byRole.LPN += 1;
      if (normalized.includes("RN")) byRole.RN += 1;

      if (c.org_id === LIBRARY_ORG_ID) bySource.library += 1;
      else bySource.org += 1;
    });

    return {
      total: competencies.length,
      filtered: filteredCompetencies.length,
      byRole,
      bySource,
    };
  }, [competencies.length, filteredCompetencies]);

  const handleClearFilters = () => {
    setSearch("");
    setRiskFilter("All");
    setRoleFilter("All roles");
    setSettingFilter("All settings");
    setLanguageFilter("all");
    setSourceFilter("All");
  };

  const filtersActive =
    !!search.trim() ||
    riskFilter !== "All" ||
    roleFilter !== "All roles" ||
    settingFilter !== "All settings" ||
    languageFilter !== "all" ||
    sourceFilter !== "All";

  const hasFiltered = filteredCompetencies.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Prebuilt · assignable · survey-ready
              </p>
              <span className="hidden sm:inline-flex rounded-full border border-border bg-muted px-2 py-1 text-[11px] text-foreground/70">
                {filtersActive ? "Filtered view" : "Full library"}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">Competency library</h1>

            <p className="max-w-2xl text-sm text-foreground/60">
              Browse what’s already built. Preview competencies before you use them— so you can stay
              covered without creating content from scratch.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => router.push("/dashboard/competencies/ai-builder")}
              className={btnSoft}
              title="Generate a new competency template"
            >
              <span className="mr-2 text-base">✨</span>
              New with AI
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/assignments")}
              className={btnPrimary}
              title="View assignments and due dates"
            >
              View assignments
            </button>
          </div>
        </header>

        {/* QUICK ROLE STRIP */}
        <section className={`${card} p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className={label}>Quick browse</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${pill} ${roleFilter === "All roles" ? pillActive : ""}`}
                  onClick={() => setRoleFilter("All roles")}
                >
                  All roles
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">
                    {counts.filtered}
                  </span>
                </button>

                {quickRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${pill} ${normalizeRoleLabel(roleFilter) === r ? pillActive : ""}`}
                    onClick={() => setRoleFilter(r)}
                  >
                    {r}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">
                      {counts.byRole[r]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                <span className={chip}>
                  CCH Library:{" "}
                  <span className="font-semibold text-foreground">{counts.bySource.library}</span>
                </span>
                <span className={chip}>
                  Your org:{" "}
                  <span className="font-semibold text-foreground">{counts.bySource.org}</span>
                </span>
              </div>

              {filtersActive && (
                <button type="button" onClick={handleClearFilters} className={btnSoft}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FILTER BAR */}
        <section className={`${card} p-4 space-y-4`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 space-y-1">
              <label className={label}>Search</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <span className="text-xs text-foreground/50">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, role, setting, tier, evidence…"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
                />
              </div>
            </div>

            {!filtersActive && (
              <button type="button" onClick={handleClearFilters} className={btnSoft}>
                Reset
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-1">
              <label className={label}>Source</label>
              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as (typeof SOURCE_OPTIONS)[number])
                }
                className={select}
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="space-y-1">
              <label className={label}>Setting</label>
              <select
                value={settingFilter}
                onChange={(e) => setSettingFilter(e.target.value)}
                className={select}
              >
                <option value="All settings">All settings</option>
                {(usedSettings.length > 0 ? usedSettings : SETTING_OPTIONS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

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
              <span className="font-semibold text-foreground">
                {filteredCompetencies.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {competencies.length}
              </span>
            </p>
            {filtersActive && <span className={chip}>Filters active</span>}
          </div>
        </section>

        {loading && <p className="text-sm text-foreground/60">Loading library…</p>}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !hasCompetencies && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6">
            <p className="text-sm font-semibold text-foreground">No competencies found.</p>
            <p className="mt-1 text-sm text-foreground/60">
              Once you seed the CCH Library org and/or add templates in your org, they’ll show up here.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/dashboard/competencies/ai-builder")}
                className={btnPrimary}
              >
                <span className="mr-2 text-base">✨</span>
                Generate a template
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/competencies")}
                className={btnSoft}
              >
                View competencies
              </button>
            </div>
          </div>
        )}

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

                  const tags: string[] = [
                    ...roles.map(normalizeRoleLabel),
                    ...settings,
                    ...(language ? [language] : []),
                  ].filter(Boolean);

                  const source: "CCH Library" | "Your org" =
                    c.org_id === LIBRARY_ORG_ID ? "CCH Library" : "Your org";

                  const meta = extractMeta(c.content);
                  const tierLabel = meta.tier ? firstLine(meta.tier, 26) : "—";
                  const evidenceLabel = meta.evidence ? firstLine(meta.evidence, 26) : "—";
                  const reassignLabel = meta.reassignment
                    ? firstLine(meta.reassignment, 26)
                    : "—";

                  return (
                    <div key={c.id} className={`${card} p-4`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold">
                              {c.title || "Untitled competency"}
                            </h2>

                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${sourceBadgeClasses(
                                source
                              )}`}
                            >
                              {source}
                            </span>

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

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={chip}>
                              <span className="mr-1 text-foreground/50">Tier:</span>
                              {tierLabel}
                            </span>
                            <span className={chip}>
                              <span className="mr-1 text-foreground/50">Evidence:</span>
                              {evidenceLabel}
                            </span>
                            <span className={chip}>
                              <span className="mr-1 text-foreground/50">Reassign:</span>
                              {reassignLabel}
                            </span>
                          </div>

                          {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tags.slice(0, 8).map((tag) => (
                                <span key={tag} className={chip}>
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 8 && (
                                <span className={chip}>+{tags.length - 8}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 md:justify-end">
                          <div className="hidden sm:block text-right">
                            <div className={label}>Created</div>
                            <div className="text-sm text-foreground/70">
                              {created || "—"}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/dashboard/library/${c.id}`)}
                              className={btnSoft}
                            >
                              Preview
                            </button>

                            {canAssign && (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/dashboard/library/${c.id}?mode=assign`)
                                }
                                className={btnPrimary}
                                title="Use this competency for assignments/tracks"
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
