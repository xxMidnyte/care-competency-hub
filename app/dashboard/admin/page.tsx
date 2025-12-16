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

const ui = {
  page: "min-h-screen bg-background text-foreground",
  container: "mx-auto max-w-6xl px-6 py-6",
  card: "rounded-2xl border border-border bg-card shadow-card",
  cardSoft: "rounded-2xl border border-border bg-muted/30 shadow-card",
  headerKicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-2xl font-semibold tracking-tight text-foreground",
  h2: "text-sm font-semibold text-foreground",
  p: "text-sm text-muted-foreground",
  pSmall: "text-xs text-muted-foreground",
  label:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  select:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  btnPrimary:
    "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnSoft:
    "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnSmallPrimary:
    "inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  toastSuccess:
    "rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground",
  toastError:
    "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground",
};

function AdminDashboardInner() {
  const { loading, context } = useUserContext();
  const org = context?.organization ?? null;
  const orgId = org?.organizationId ?? null;

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

    if (org.isDevOrg) {
      setFeatureMessage(
        "Dev org sees all features as ON. Use a non-dev org to test feature-limited plans."
      );
      return;
    }

    const prevFlags = featureFlags || {};
    const current = !!prevFlags[jsonKey];
    const nextFlags: FeatureFlags = { ...prevFlags, [jsonKey]: !current };

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
      <div className="space-y-3">
        <p className={ui.headerKicker}>Admin</p>
        <h1 className={ui.h1}>Admin dashboard</h1>
        <p className={ui.p}>Loading organization data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className={ui.headerKicker}>Admin</p>
        <h1 className={ui.h1}>
          {org?.organizationName
            ? `${org.organizationName} – Admin dashboard`
            : "Admin dashboard"}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Configure your organization, manage features, and get a high-level view
          of what&apos;s turned on.
        </p>
      </div>

      {/* Org summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className={`${ui.card} p-4`}>
          <div className={ui.label}>Organization</div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {org?.organizationName ?? "Unknown organization"}
          </div>
          <div className="mt-1 break-all text-xs text-muted-foreground">
            ID: {org?.organizationId ?? "n/a"}
          </div>
        </div>

        <div className={`${ui.card} p-4`}>
          <div className={ui.label}>Your role</div>
          <div className="mt-2 text-lg font-semibold capitalize text-foreground">
            {org?.role ?? "Unknown"}
          </div>
          {org?.isDevOrg && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
              Dev organization bypass active
            </div>
          )}
        </div>

        <div className={`${ui.card} p-4`}>
          <div className={ui.label}>Quick actions</div>
          <ul className="mt-3 space-y-1 text-sm text-foreground/80">
            <li>• Review enabled modules</li>
            <li>• Confirm manager access is correct</li>
            <li>• Use dev org to preview upcoming features</li>
          </ul>
        </div>
      </section>

      {/* Feature flags */}
      <section className="space-y-3">
        <h2 className={ui.h2}>Enabled features</h2>
        <p className="max-w-xl text-xs text-muted-foreground">
          These toggles are controlled at the organization level. Dev orgs see
          everything enabled.
        </p>

        {org?.isDevOrg && (
          <div className={`${ui.cardSoft} p-4 text-sm text-foreground/80`}>
            Dev org: All features are forced <b>ON</b> visually. Use a non-dev org
            to test locked plans.
          </div>
        )}

        {featureError && <div className={ui.toastError}>{featureError}</div>}
        {featureMessage && (
          <div className={ui.toastSuccess}>{featureMessage}</div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(FEATURE_LABELS).map(([jsonKey, label]) => {
            const enabled = org?.isDevOrg
              ? true
              : !!(featureFlags && featureFlags[jsonKey as keyof FeatureFlags]);

            const isSaving = featureSavingKey === String(jsonKey);

            return (
              <div key={jsonKey} className={`${ui.card} p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {enabled
                        ? "Visible in the dashboard and facility views."
                        : "Hidden for this organization in the current plan."}
                    </div>
                    {!org?.isDevOrg && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Toggle to grant or remove access at the org level.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleFeature(jsonKey as keyof FeatureFlags)
                    }
                    disabled={org?.isDevOrg || isSaving}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background ${
                      enabled
                        ? "border-primary/40 bg-primary/15 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    } ${org?.isDevOrg ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <span
                      className={`absolute left-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[9px] text-background shadow transition-transform ${
                        enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    >
                      {enabled ? "✓" : ""}
                    </span>
                    <span className="ml-auto mr-1">
                      {isSaving ? "…" : enabled ? "On" : "Off"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <StaffLinkManager orgId={orgId} />

      <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
        <div className={ui.label}>Coming soon</div>
        <h2 className="mt-2 text-sm font-semibold text-foreground">
          Admin tools for multi-facility operators
        </h2>
        <p className="mt-1 max-w-xl text-xs text-muted-foreground">
          Cross-facility reporting, bulk assignments, and subscription management.
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
  const [editingEmails, setEditingEmails] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFacilityId, setNewFacilityId] = useState<string>("");
  const [creating, setCreating] = useState(false);

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
      setFacilitiesError(null);

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
      staff.forEach((s) => (initialEmails[s.id] = s.email ?? ""));
      setEditingEmails(initialEmails);

      const { data: facs, error: facError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (facError) {
        console.error("Admin facilities load error:", facError);
        setFacilitiesError("Unable to load facilities.");
      } else {
        const list = (facs || []) as FacilityRow[];
        setFacilities(list);
        if (list.length > 0) setNewFacilityId(list[0].id);
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
      setGlobalMessage("Email cannot be empty.");
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
      console.error("Update staff email error:", updateError);
      setGlobalMessage(updateError.message || "Failed to update email.");
      setSavingId(null);
      return;
    }

    setGlobalMessage(
      "Staff email updated. Make sure it matches the user’s login email."
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
        facility_id: newFacilityId,
        full_name: name || null,
        email,
      })
      .select("id, full_name, email")
      .single();

    if (insertError) {
      console.error("Create staff error:", insertError);
      setGlobalMessage(insertError.message || "Failed to create staff profile.");
      setCreating(false);
      return;
    }

    const newRow = data as StaffMemberRow;

    setRows((prev) =>
      [...prev, newRow].sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      )
    );

    setEditingEmails((prev) => ({ ...prev, [newRow.id]: newRow.email ?? "" }));

    setNewName("");
    setNewEmail("");
    setCreating(false);
    setGlobalMessage("Staff profile created.");
  }

  return (
    <section className="space-y-3">
      <h2 className={ui.h2}>Staff account links</h2>
      <p className="max-w-xl text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">staff_members.email</span>{" "}
        must match the auth email for the user’s assignments to show up in My
        dashboard.
      </p>

      {/* Create */}
      <div className={`${ui.card} p-4 space-y-3`}>
        <div className={ui.label}>Add staff profile</div>
        {facilitiesError && (
          <div className="text-sm text-foreground/80">{facilitiesError}</div>
        )}

        <div className="grid items-end gap-3 md:grid-cols-[1.1fr_1.3fr_1fr_auto]">
          <div className="space-y-1">
            <label className={ui.label}>Full name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Shane Rakke"
              className={ui.input}
            />
          </div>

          <div className="space-y-1">
            <label className={ui.label}>Login email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className={ui.input}
            />
          </div>

          <div className="space-y-1">
            <label className={ui.label}>Facility</label>
            <select
              value={newFacilityId}
              onChange={(e) => setNewFacilityId(e.target.value)}
              className={ui.select}
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
            className={ui.btnSmallPrimary}
          >
            {creating ? "Creating…" : "Add staff"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className={ui.card}>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Staff for this organization
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {rows.length} staff profile{rows.length === 1 ? "" : "s"}.
            </div>
          </div>
          <div className="w-full max-w-xs space-y-1">
            <label className={ui.label}>Filter</label>
            <input
              type="text"
              placeholder="Name or email…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={ui.input}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading staff…</div>
        ) : error ? (
          <div className="p-4 text-sm text-foreground/80">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No staff members found for this organization yet.
          </div>
        ) : (
          <>
            {globalMessage && (
              <div className="px-4 pt-4 text-sm text-foreground/80">
                {globalMessage}
              </div>
            )}
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-card/95 backdrop-blur">
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 text-left font-semibold">
                      Staff member
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Linked email
                    </th>
                    <th className="px-4 py-2 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-foreground">
                          {row.full_name || "(No name set)"}
                        </div>
                        {row.email && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Current: {row.email}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top">
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
                          className={ui.input}
                        />
                      </td>

                      <td className="px-4 py-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveEmail(row.id)}
                          disabled={savingId === row.id}
                          className={ui.btnSmallPrimary}
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
                        className="px-4 py-4 text-sm text-muted-foreground"
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
      <div className={ui.page}>
        <div className={ui.container}>
          <AdminDashboardInner />
        </div>
      </div>
    </RequireRole>
  );
}
