"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

export default function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams<{ policyId: string }>();
  const policyId = params.policyId;

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);

  // edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<string>("Clinical");
  const [editFacilityId, setEditFacilityId] = useState<string>("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!policyId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // fetch policy
        const { data: policyData, error: policyError } = await supabase
          .from("policies")
          .select("*")
          .eq("id", policyId)
          .single();

        if (policyError || !policyData) {
          console.error("Policy load error:", policyError);
          setError("Unable to load policy.");
          return;
        }

        setPolicy(policyData as Policy);

        // facilities for this org (for dropdown)
        if (policyData.org_id) {
          const { data: facilitiesData, error: facilitiesError } =
            await supabase
              .from("facilities")
              .select("id, name")
              .eq("org_id", policyData.org_id)
              .order("name", { ascending: true });

          if (!facilitiesError && facilitiesData) {
            setFacilities(facilitiesData as Facility[]);
          }
        }

        // facility for display
        if (policyData.facility_id) {
          const { data: facilityData, error: facilityError } = await supabase
            .from("facilities")
            .select("id, name")
            .eq("id", policyData.facility_id)
            .single();

          if (!facilityError && facilityData) {
            setFacility(facilityData as Facility);
          }
        }

        // init edit fields
        const tagsArray = Array.isArray(policyData.tags)
          ? (policyData.tags as string[])
          : [];

        setEditTitle(policyData.title ?? "");
        setEditDescription(policyData.description ?? "");
        setEditCategory(policyData.category ?? "Clinical");
        setEditFacilityId(policyData.facility_id ?? "");
        setEditTagsInput(tagsArray.join(", "));
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this policy.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [policyId, router]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!policy) return;

    try {
      setSavingEdit(true);
      setError(null);

      const tags =
        editTagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0) || [];

      const updatePayload: Record<string, any> = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory,
        facility_id: editFacilityId || null,
        tags,
      };

      const { data, error } = await supabase
        .from("policies")
        .update(updatePayload)
        .eq("id", policy.id)
        .select("*")
        .single();

      if (error) {
        console.error("Edit policy supabase error:", error);
        throw new Error(error.message || "Failed to update policy.");
      }

      const updated = data as Policy;
      setPolicy(updated);

      // refresh facility label
      if (updated.facility_id) {
        const f =
          facilities.find((f) => f.id === updated.facility_id) ?? null;
        setFacility(f);
      } else {
        setFacility(null);
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to update policy.");
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6">
          <p className="text-sm text-slate-500">Loading policy…</p>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="px-4 py-6 space-y-3">
          <button
            onClick={() => router.back()}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Back to policies
          </button>
          <h1 className="text-xl font-semibold">Policy not found</h1>
          <p className="text-sm text-red-500">{error ?? "Policy not found."}</p>
        </div>
      </div>
    );
  }

  const tags = Array.isArray(policy.tags) ? (policy.tags as string[]) : [];
  const updated = new Date(policy.updated_at);

  const facilityName = policy.facility_id
    ? facility?.name || "Unknown facility"
    : "All facilities";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="px-4 py-6 space-y-4 max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← Back to policies
        </button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {policy.title}
            </h1>
            {policy.description && !isEditing && (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {policy.description}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Category:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {policy.category}
              </span>{" "}
              · Updated{" "}
              {updated.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-slate-500">
              Facility:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {facilityName}
              </span>
            </p>
            {policy.is_archived && (
              <p className="mt-2 inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                Archived
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/80 transition"
            >
              {isEditing ? "Cancel edit" : "Edit metadata"}
            </button>
            <a
              href={policy.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/80 transition"
            >
              Open PDF in new tab
            </a>
          </div>
        </div>

        {/* Edit form */}
        {isEditing && (
          <form
            onSubmit={handleSaveEdit}
            className="space-y-4 rounded-lg border border-slate-200 bg-[var(--surface-soft)] p-4"
          >
            {error && (
              <div className="mb-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Short description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Facility
                </label>
                <select
                  value={editFacilityId}
                  onChange={(e) => setEditFacilityId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">All facilities (org-wide)</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || "Unnamed facility"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/80 transition disabled:opacity-60"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60"
                disabled={savingEdit}
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {/* Tags */}
        {!isEditing && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* PDF viewer */}
        <div className="mt-4 h-[70vh] overflow-hidden rounded-lg border border-slate-200 bg-[var(--surface)]">
          <iframe
            src={policy.file_url}
            className="h-full w-full"
            title={policy.title}
          />
        </div>
      </div>
    </div>
  );
}
