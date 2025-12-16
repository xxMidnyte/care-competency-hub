// app/dashboard/policies/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Facility = {
  id: string;
  name: string | null;
};

type Policy = {
  id: string;
  org_id: string;
  facility_id: string | null;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  tags: any;
  version_number: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

const CATEGORY_OPTIONS = [
  "All",
  "HR",
  "Clinical",
  "Safety",
  "Emergency",
  "Infection Control",
  "Administrative",
  "Other",
];

const card = "rounded-2xl border border-border bg-card shadow-card";
const cardInner = "p-4";
const muted = "text-foreground/60";
const label =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const select =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const chip = "rounded-full bg-muted px-2 py-1 text-[11px] text-foreground/70";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnDangerSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

export default function PoliciesPage() {
  const router = useRouter();

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasPolicyModule = org?.featureFlags?.has_policy_module ?? false;
  const hasModuleAccess = isDevOrg || hasPolicyModule;

  const canManagePolicies =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  const [loading, setLoading] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [archiveUpdatingId, setArchiveUpdatingId] = useState<string | null>(
    null
  );

  const facilityNameMap = useMemo(() => {
    return facilities.reduce((acc, f) => {
      if (f.id) acc[f.id] = f.name || "Unnamed facility";
      return acc;
    }, {} as Record<string, string>);
  }, [facilities]);

  // Initial load: org context -> facilities + policies
  useEffect(() => {
    async function load() {
      try {
        if (orgLoading) return;

        setLoading(true);
        setError(null);

        if (!organizationId || !org) {
          setError("Unable to load your organization.");
          return;
        }

        if (!hasModuleAccess) {
          setError("The policy library is not enabled for your organization yet.");
          return;
        }

        setOrgId(organizationId);

        // 1) Facilities
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from("facilities")
          .select("id, name")
          .eq("org_id", organizationId)
          .order("name", { ascending: true });

        if (facilitiesError) {
          console.error("Facilities load error:", facilitiesError);
          setError("Unable to load facilities.");
          return;
        }

        setFacilities(facilitiesData ?? []);

        // 2) Policies
        await fetchPolicies(organizationId, {
          facilityId: "all",
          category: "All",
          search: "",
          includeArchived: false,
        });
      } catch (err) {
        console.error("Policies initial load error:", err);
        setError("Something went wrong loading policies.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, org, organizationId, hasModuleAccess]);

  async function fetchPolicies(
    currentOrgId: string,
    opts?: {
      facilityId?: string;
      category?: string;
      search?: string;
      includeArchived?: boolean;
    }
  ) {
    try {
      setLoadingPolicies(true);
      setError(null);

      const facilityId =
        opts?.facilityId && opts.facilityId !== "all"
          ? opts.facilityId
          : undefined;
      const category =
        opts?.category && opts.category !== "All" ? opts.category : undefined;
      const q = opts?.search?.trim() || "";
      const includeArch = opts?.includeArchived ?? false;

      const params = new URLSearchParams();
      params.set("orgId", currentOrgId);
      if (facilityId) params.set("facilityId", facilityId);
      if (category) params.set("category", category);
      if (q) params.set("q", q);
      if (includeArch) params.set("includeArchived", "true");

      const res = await fetch(`/api/policies?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Failed to load policies:", body);
        throw new Error(body?.error || "Failed to load policies.");
      }

      const body = (await res.json()) as { policies: Policy[] };
      setPolicies(body.policies ?? []);
    } catch (err: any) {
      console.error("fetchPolicies error:", err);
      setError(err.message || "Unable to load policies.");
    } finally {
      setLoadingPolicies(false);
    }
  }

  async function handleApplyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    if (!orgId) return;

    await fetchPolicies(orgId, {
      facilityId: selectedFacilityId,
      category: selectedCategory,
      search,
      includeArchived,
    });
  }

  async function handleToggleArchive(policy: Policy) {
    if (!canManagePolicies) return;

    try {
      setArchiveUpdatingId(policy.id);
      setError(null);

      const { data, error } = await supabase
        .from("policies")
        .update({ is_archived: !policy.is_archived })
        .eq("id", policy.id)
        .select("id, is_archived")
        .single();

      if (error) throw new Error(error.message || "Failed to update policy.");
      if (!data) throw new Error("No data returned from archive update.");

      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policy.id ? { ...p, is_archived: data.is_archived } : p
        )
      );
    } catch (err: any) {
      console.error("Archive toggle handler error:", err);
      setError(err.message || "Unable to update policy.");
    } finally {
      setArchiveUpdatingId(null);
    }
  }

  // Loading wrapper
  if (loading || orgLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-foreground/60">
          Loading policies…
        </div>
      </div>
    );
  }

  // Hard errors only: missing org context OR module not enabled
  if (!organizationId || !hasModuleAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-3">
          <h1 className="text-xl font-semibold">Policies</h1>
          <p className="text-sm text-red-400">
            {error ||
              (!organizationId
                ? "Unable to load your organization."
                : "The policy library is not enabled for your organization yet.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Store, search, and manage policies for your organization.
            </p>
          </div>

          {canManagePolicies && (
            <Link href="/dashboard/policies/new" className={btnPrimary}>
              <span className="mr-2">＋</span>
              Add policy
            </Link>
          )}
        </div>

        {/* Non-hard error banner */}
        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* FILTERS */}
        <form onSubmit={handleApplyFilters} className={`${card} ${cardInner}`}>
          <div className="flex flex-wrap items-end gap-3">
            {/* Facility */}
            <div className="min-w-[180px] space-y-1">
              <label className={label}>Facility</label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className={select}
              >
                <option value="all">All facilities</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || "Unnamed facility"}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="min-w-[180px] space-y-1">
              <label className={label}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={select}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="min-w-[220px] flex-1 space-y-1">
              <label className={label}>Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or description…"
                className={input}
              />
            </div>

            {/* Include archived */}
            <label className="flex items-center gap-2 text-sm text-foreground/70">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background"
              />
              Include archived
            </label>

            {/* Apply */}
            <button
              type="submit"
              className={btnSoft}
              disabled={loadingPolicies}
            >
              {loadingPolicies ? "Updating…" : "Apply filters"}
            </button>
          </div>
        </form>

        {/* LIST */}
        <div className={card}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Policies</span>
            <span className="text-xs text-foreground/60">
              {policies.length} item{policies.length === 1 ? "" : "s"}
            </span>
          </div>

          {policies.length === 0 ? (
            <div className="px-4 py-8 text-sm text-foreground/60">
              No policies found. Try adjusting your filters or{" "}
              {canManagePolicies ? (
                <Link
                  href="/dashboard/policies/new"
                  className="text-primary underline underline-offset-4"
                >
                  add your first policy
                </Link>
              ) : (
                "ask your administrator to add policies"
              )}
              .
            </div>
          ) : (
            <ul className="space-y-3 p-3">
              {policies.map((policy) => {
                const tagList = Array.isArray(policy.tags)
                  ? (policy.tags as string[])
                  : [];

                const facilityName = policy.facility_id
                  ? facilityNameMap[policy.facility_id] || "Unknown facility"
                  : "All facilities";

                const updated = new Date(policy.updated_at);

                const archiveLabel = policy.is_archived ? "Unarchive" : "Archive";
                const isArchiveBusy = archiveUpdatingId === policy.id;

                return (
                  <li key={policy.id}>
                    <div
                      className={`rounded-2xl border border-border bg-card shadow-card p-4 transition hover:opacity-95 ${
                        policy.is_archived ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/dashboard/policies/${policy.id}`}
                              className="text-base font-semibold text-foreground hover:opacity-90"
                            >
                              {policy.title}
                            </Link>

                            {policy.is_archived && (
                              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase text-foreground/60">
                                Archived
                              </span>
                            )}

                            {policy.version_number > 1 && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase text-primary">
                                v{policy.version_number}
                              </span>
                            )}
                          </div>

                          {policy.description && (
                            <p className="text-sm text-foreground/60 line-clamp-2">
                              {policy.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <span className={chip}>{policy.category}</span>
                          <span className={chip}>{facilityName}</span>
                          <span className={chip}>
                            Updated{" "}
                            {updated.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {tagList.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tagList.map((tag) => (
                            <span key={tag} className={chip}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <a
                          href={policy.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={btnSoft}
                        >
                          View PDF
                        </a>

                        <Link
                          href={`/dashboard/policies/${policy.id}`}
                          className={btnSoft}
                        >
                          Details
                        </Link>

                        {canManagePolicies && (
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(policy)}
                            disabled={isArchiveBusy}
                            className={btnDangerSoft}
                          >
                            {isArchiveBusy ? "Updating…" : archiveLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
