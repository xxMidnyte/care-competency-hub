// app/dashboard/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { useUserContext } from "@/hooks/useUserContext";
import type { FeatureFlags } from "@/lib/userContext";
import { supabase } from "@/lib/supabaseClient";

const FEATURE_LABELS: Record<string, string> = {
  has_policy_module: "Policy & document hub",
  has_track_builder: "Career track builder",
  has_survey_shield: "SurveyShield (deficiency tracking)",
};

type StaffMemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function AdminDashboardInner() {
  const { loading, context } = useUserContext();
  const org = context?.organization ?? null;
  const orgId = org?.organizationId ?? null;

  // Local feature flag state for toggles
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [featureSavingKey, setFeatureSavingKey] = useState<string | null>(null);
  const [featureMessage, setFeatureMessage] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);

  useEffect(() => {
    if (org) {
      setFeatureFlags(org.featureFlags || {});
      setFeatureMessage(null);
      setFeatureError(null);
    }
  }, [org]);

  async function handleToggleFeature(jsonKey: keyof FeatureFlags) {
    if (!org || !orgId) return;

    // Dev org: visually everything is on and not editable
    if (org.isDevOrg) {
      setFeatureMessage(
        "Dev org sees all features as ON. Use a non-dev org to test feature-limited plans."
      );
      return;
    }

    const prevFlags = featureFlags || {};
    const current = !!prevFlags[jsonKey];
    const nextFlags: FeatureFlags = {
      ...prevFlags,
      [jsonKey]: !current,
    };

    setFeatureFlags(nextFlags);
    setFeatureSavingKey(String(jsonKey));
    setFeatureError(null);
    setFeatureMessage(null);

    const { error } = await supabase
      .from("organizations")
      .update({ feature_flags: nextFlags })
      .eq("id", orgId);

    if (error) {
      console.error("Admin feature toggle error:", error);
      // revert
      setFeatureFlags(prevFlags);
      setFeatureError(
        error.message || "Failed to update feature flags. Please try again."
      );
    } else {
      setFeatureMessage("Feature settings updated for this organization.");
    }

    setFeatureSavingKey(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Admin
        </p>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-slate-400">Loading organization data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {org?.organizationName
            ? `${org.organizationName} – Admin dashboard`
            : "Admin dashboard"}
        </h1>
        <p className="max-w-xl text-sm text-slate-400">
          Configure your organization, manage features, and get a high-level
          view of what&apos;s turned on. Managers can still work from the main
          dashboard and facility views.
        </p>
      </div>

      {/* Organization summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Organization
          </p>
          <p className="mt-1 text-base font-semibold">
            {org?.organizationName ?? "Unknown organization"}
          </p>
          <p className="mt-1 break-all text-xs text-slate-500">
            ID: {org?.organizationId ?? "n/a"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Your role
          </p>
          <p className="mt-1 text-base font-semibold capitalize">
            {org?.role ?? "Unknown"}
          </p>
          {org?.isDevOrg && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
              Dev organization bypass active
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Quick actions
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>• Review enabled modules</li>
            <li>• Confirm manager access is correct</li>
            <li>• Use dev org to preview upcoming features</li>
          </ul>
        </div>
      </section>

      {/* Feature flags overview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Enabled features</h2>
        <p className="max-w-xl text-xs text-slate-400">
          These toggles are controlled at the organization level. Dev
          organizations automatically see all features as enabled; customer orgs
          can be configured here.
        </p>

        {org?.isDevOrg && (
          <p className="text-xs text-amber-300">
            Dev org: All features are forced <span className="font-semibold">ON</span> visually
            across the app. Use a non-dev org to test locked plans.
          </p>
        )}

        {featureError && (
          <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {featureError}
          </div>
        )}

        {featureMessage && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {featureMessage}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(FEATURE_LABELS).map(([jsonKey, label]) => {
            const enabled = org?.isDevOrg
              ? true
              : !!(
                  featureFlags &&
                  featureFlags[jsonKey as keyof FeatureFlags]
                );

            const isSaving = featureSavingKey === String(jsonKey);

            return (
              <div
                key={jsonKey}
                className="flex items-start justify-between rounded-xl border border-slate-800 bg-[var(--surface-soft)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {enabled
                      ? "Visible in the dashboard and facility views."
                      : "Hidden for this organization in the current plan."}
                  </p>
                  {!org?.isDevOrg && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Toggle to grant or remove access at the org level.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggleFeature(jsonKey as keyof FeatureFlags)
                  }
                  disabled={org?.isDevOrg || isSaving}
                  className={`relative ml-3 inline-flex h-6 w-11 items-center rounded-full border px-0.5 text-[11px] font-semibold transition ${
                    enabled
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-700 bg-[var(--surface)] text-slate-400"
                  } ${
                    org?.isDevOrg
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }`}
                >
                  <span
                    className={`absolute left-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-slate-900 shadow transition-transform ${
                      enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  >
                    {enabled ? "✓" : ""}
                  </span>
                  <span className="ml-auto mr-1">
                    {isSaving ? "…" : enabled ? "On" : "Off"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Staff account linking UI */}
      <StaffLinkManager orgId={orgId} />

      {/* Placeholder for future admin tools */}
      <section className="rounded-xl border border-dashed border-slate-700 bg-[var(--surface-soft)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Coming soon
        </p>
        <h2 className="mt-2 text-sm font-semibold">
          Admin tools for multi-facility operators
        </h2>
        <p className="mt-1 max-w-xl text-xs text-slate-400">
          In the full release, this area will include cross-facility reporting,
          bulk assignments, and subscription management. For now, managers and
          admins can manage competencies and staff from the main dashboard and
          facility pages.
        </p>
      </section>
    </div>
  );
}

function StaffLinkManager({ orgId }: { orgId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StaffMemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [editingEmails, setEditingEmails] = useState<Record<string, string>>(
    {}
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  // New-staff form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFacilityId, setNewFacilityId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Facilities for this org
  type FacilityRow = { id: string; name: string | null };
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      setError("No organization ID available.");
      return;
    }

    async function loadAll() {
      setLoading(true);
      setError(null);
      setGlobalMessage(null);

      // 1) Load staff
      const { data, error: staffError } = await supabase
        .from("staff_members")
        .select("id, full_name, email")
        .eq("org_id", orgId)
        .order("full_name", { ascending: true });

      if (staffError) {
        console.error("Admin staff load error:", staffError);
        setError("Unable to load staff for this organization.");
        setLoading(false);
        return;
      }

      const staff = (data || []) as StaffMemberRow[];
      setRows(staff);

      const initialEmails: Record<string, string> = {};
      staff.forEach((s) => {
        initialEmails[s.id] = s.email ?? "";
      });
      setEditingEmails(initialEmails);

      // 2) Load facilities
      const { data: facs, error: facError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (facError) {
        console.error("Admin facilities load error:", facError);
        setFacilitiesError("Unable to load facilities.");
      } else {
        setFacilities((facs || []) as FacilityRow[]);
        if (facs && facs.length > 0) {
          setNewFacilityId(facs[0].id);
        }
      }

      setLoading(false);
    }

    loadAll();
  }, [orgId]);

  const filteredRows = rows.filter((row) => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return (
      (row.full_name ?? "").toLowerCase().includes(f) ||
      (row.email ?? "").toLowerCase().includes(f)
    );
  });

  async function handleSaveEmail(id: string) {
    if (!orgId) return;

    const email = (editingEmails[id] || "").trim();
    if (!email) {
      setGlobalMessage(
        "Email cannot be empty. Enter the login email for this staff member."
      );
      return;
    }

    setSavingId(id);
    setGlobalMessage(null);

    const { error: updateError } = await supabase
      .from("staff_members")
      .update({ email })
      .eq("id", id)
      .eq("org_id", orgId);

    if (updateError) {
      console.error(
        "Update staff email error:",
        updateError,
        updateError?.message
      );
      setGlobalMessage(
        updateError.message || "Failed to update email. Please try again."
      );
      setSavingId(null);
      return;
    }

    setGlobalMessage(
      "Staff email updated. Make sure it matches the user’s login email so their dashboard links correctly."
    );
    setSavingId(null);
  }

  async function handleCreateStaff() {
    if (!orgId) return;

    const name = newName.trim();
    const email = newEmail.trim();

    if (!email) {
      setGlobalMessage("Enter an email to create a staff profile.");
      return;
    }
    if (!newFacilityId) {
      setGlobalMessage("Choose a facility for this staff member.");
      return;
    }

    setCreating(true);
    setGlobalMessage(null);

    const { data, error: insertError } = await supabase
      .from("staff_members")
      .insert({
        org_id: orgId,
        facility_id: newFacilityId, // 👈 make sure facility is set
        full_name: name || null,
        email,
      })
      .select("id, full_name, email")
      .single();

    if (insertError) {
      console.error(
        "Create staff error:",
        insertError,
        insertError?.message,
        insertError?.details
      );
      setGlobalMessage(
        insertError.message ||
          "Failed to create staff profile. Please check Supabase constraints/RLS and try again."
      );
      setCreating(false);
      return;
    }

    const newRow = data as StaffMemberRow;

    setRows((prev) => {
      const next = [...prev, newRow].sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      );
      return next;
    });

    setEditingEmails((prev) => ({
      ...prev,
      [newRow.id]: newRow.email ?? "",
    }));

    setNewName("");
    setNewEmail("");
    setCreating(false);
    setGlobalMessage(
      "Staff profile created. If this email matches a login account, their My dashboard will now be linked."
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Staff account links</h2>
      <p className="max-w-xl text-xs text-slate-400">
        Use this to link staff profiles to the login accounts used for{" "}
        <span className="font-medium">My dashboard</span>. The{" "}
        <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-[10px]">
          staff_members.email
        </code>{" "}
        must match the user&apos;s auth email for their assignments to appear.
      </p>

      {/* Create new staff profile */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-[var(--surface-soft)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Add staff profile
        </p>
        {facilitiesError && (
          <p className="text-xs text-rose-300">{facilitiesError}</p>
        )}
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1.2fr),minmax(0,1.4fr),minmax(0,1.2fr),auto]">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Full name (optional)
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Shane Rakke"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Login email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Facility
            </label>
            <select
              value={newFacilityId}
              onChange={(e) => setNewFacilityId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {facilities.length === 0 ? (
                <option value="">No facilities</option>
              ) : (
                facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || "Unnamed facility"}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCreateStaff}
            disabled={creating || !orgId}
            className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating…" : "Add staff"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Staff for this organization</p>
            <p className="text-xs text-slate-400">
              {rows.length} staff profile{rows.length === 1 ? "" : "s"}. Update
              the email to match the login account.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <input
              type="text"
              placeholder="Filter by name or email…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-400">Loading staff…</div>
        ) : error ? (
          <div className="px-4 py-6 text-sm text-rose-200">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">
            No staff members found for this organization yet.
          </div>
        ) : (
          <>
            {globalMessage && (
              <div className="mx-4 mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {globalMessage}
              </div>
            )}
            <div className="mt-2 max-h-[360px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[var(--surface)] backdrop-blur">
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 text-left font-medium">
                      Staff member
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Linked email (auth user)
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-900/60 align-top"
                    >
                      <td className="px-4 py-3 text-xs text-slate-200">
                        <div className="font-medium text-[var(--foreground)]">
                          {row.full_name || "(No name set)"}
                        </div>
                        {row.email && (
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Current: {row.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <input
                          type="email"
                          value={editingEmails[row.id] ?? ""}
                          onChange={(e) =>
                            setEditingEmails((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          placeholder="user@example.com"
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <button
                          type="button"
                          onClick={() => handleSaveEmail(row.id)}
                          disabled={savingId === row.id}
                          className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === row.id ? "Saving…" : "Save link"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-xs text-slate-400"
                      >
                        No staff match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole minRole="admin" redirectTo="/dashboard">
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <AdminDashboardInner />
        </div>
      </div>
    </RequireRole>
  );
}
