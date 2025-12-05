// app/dashboard/policies/new/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Facility = {
  id: string;
  name: string | null;
};

const CATEGORY_OPTIONS = [
  "HR",
  "Clinical",
  "Safety",
  "Emergency",
  "Infection Control",
  "Administrative",
  "Other",
];

export default function NewPolicyPage() {
  const router = useRouter();

  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasPolicyModule = org?.featureFlags?.has_policy_module ?? false;
  const hasModuleAccess = isDevOrg || hasPolicyModule;

  const canManagePolicies =
    userRole === "dev" || userRole === "admin" || userRole === "manager";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Clinical");
  const [facilityId, setFacilityId] = useState<string>(""); // "" = all facilities
  const [tagsInput, setTagsInput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Initial load: org context -> facilities
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
          setError(
            "The policy library is not enabled for your organization yet."
          );
          return;
        }

        if (!canManagePolicies) {
          setError("You do not have permission to add policies.");
          return;
        }

        // Facilities for this organization
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from("facilities")
          .select("id, name")
          .eq("org_id", organizationId)
          .order("name", { ascending: true });

        if (facilitiesError) {
          console.error(facilitiesError);
          setError("Unable to load facilities.");
          return;
        }

        setFacilities(facilitiesData ?? []);
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this page.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgLoading, org, organizationId, hasModuleAccess, canManagePolicies]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId) {
      setError("Missing organization context.");
      return;
    }

    if (!canManagePolicies) {
      setError("You do not have permission to add policies.");
      return;
    }

    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    try {
      setSaving(true);

      // 1) Get current user for createdBy
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to create a policy.");
        setSaving(false);
        return;
      }

      const createdBy = user.id;

      // 2) Upload to Supabase Storage
      const bucket = "policies"; // make sure this exists in Supabase Storage
      const sanitizedName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${organizationId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        setError("Failed to upload file.");
        setSaving(false);
        return;
      }

      // 3) Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const fileUrl = publicUrlData.publicUrl;

      // 4) Build tags array from comma-separated input
      const tags =
        tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0) || [];

      // 5) Call API to create the policy row
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: organizationId,
          facilityId: facilityId || null,
          title: title.trim(),
          description: description.trim() || null,
          fileUrl,
          category,
          tags,
          createdBy,
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Create policy error:", body);
        setError(body?.error || "Failed to create policy.");
        setSaving(false);
        return;
      }

      setSuccess("Policy created successfully.");
      // small delay then go back to list
      setTimeout(() => {
        router.push("/dashboard/policies");
      }, 800);
    } catch (err) {
      console.error(err);
      setError("Unexpected error creating policy.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && (!hasModuleAccess || !canManagePolicies || !organizationId)) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-6">
          <h1 className="text-xl font-semibold">Add policy</h1>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Add policy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload a policy PDF and add metadata so your team can easily find
            it.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-[var(--surface-soft)] p-4"
        >
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Example: Wound Care Policy (2025 Update)"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Short description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Briefly describe what this policy covers or when it was last updated."
            />
          </div>

          {/* Facility + Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Facility
              </label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All facilities (org-wide)</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || "Unnamed facility"}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Leave blank if this policy applies to all facilities.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Examples: wound care, RN, LTC"
            />
            <p className="text-[11px] text-slate-500">
              Tags help staff find policies by topic, discipline, or setting.
            </p>
          </div>

          {/* File upload */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Policy file (PDF) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[var(--foreground)]"
            />
            <p className="text-[11px] text-slate-500">
              Upload the finalized PDF version of your policy.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100/70 disabled:opacity-60"
              onClick={() => router.push("/dashboard/policies")}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
