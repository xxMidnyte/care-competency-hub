// app/dashboard/tracks/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

const card = "rounded-2xl border border-border bg-card shadow-card";
const input =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]";
const textarea =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]";
const btnSoft =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed";

function isManagerRole(role: string | null | undefined) {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "manager" || r === "dev";
}

function slugify(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewTrackPage() {
  const router = useRouter();
  const { org, organizationId, loading: orgLoading } = useOrg();
  const canManage = isManagerRole(org?.role);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string>("✨");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = useMemo(() => slugify(title), [title]);
  const slugToUse = slug.trim() || autoSlug;

  useEffect(() => {
    // keep slug gently in sync unless user has started typing their own
    if (!slug) return;
  }, [slug]);

  useEffect(() => {
    // If user hasn't typed a custom slug yet, keep it synced live
    // (only overwrite when slug is blank or matches previous auto)
    setSlug((prev) => {
      if (!prev) return autoSlug;
      // if prev looks like it was auto-generated from title, update it
      // heuristic: if prev equals slugified(prevTitle) isn't available, so we use: if prev === slugify(prev) always true.
      // keep it simple: don't overwrite custom input
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlug]);

  async function handleCreate() {
    setError(null);

    if (!canManage) {
      setError("You don’t have permission to create tracks.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Track title is required.");
      return;
    }

    const cleanSlug = slugToUse;
    if (!cleanSlug) {
      setError("Slug is required (it will be auto-generated from the title).");
      return;
    }

    setSaving(true);
    try {
      // If your tracks table does NOT have org_id nullable, keep organizationId.
      // Your sample insert shows org_id can be null — but we should still set it when available.
      const payload: any = {
        title: cleanTitle,
        slug: cleanSlug,
        description: description.trim() || null,
        icon: icon || null,
      };

      if (organizationId) payload.org_id = organizationId;

      const { data, error: insErr } = await supabase
        .from("tracks")
        .insert(payload)
        .select("id")
        .single();

      if (insErr) {
        console.error("Create track error:", insErr);

        // common: duplicate slug constraint, RLS, missing column, etc.
        if ((insErr as any).code === "23505") {
          setError("That slug is already taken. Try a different one.");
        } else {
          setError("Could not create track. Check your table/RLS settings.");
        }
        return;
      }

      // take them straight into the Builder flow
      router.push(`/dashboard/tracks/${data.id}/builder`);
    } finally {
      setSaving(false);
    }
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 py-6 text-sm text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
          <div className={card + " p-6"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Tracks
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Create track
            </h1>
            <p className="mt-2 text-sm text-foreground/60">
              You don’t have permission to create tracks. Ask an admin/manager to create one.
            </p>

            <div className="mt-5">
              <button onClick={() => router.push("/dashboard/tracks")} className={btnSoft}>
                Back to tracks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Tracks
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create a new track
            </h1>
            <p className="text-sm text-foreground/60">
              Define a structured learning journey (sections + modules) and assign it to staff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/dashboard/tracks")} className={btnSoft}>
              Cancel
            </button>
            <button onClick={handleCreate} className={btnPrimary} disabled={saving}>
              {saving ? "Creating…" : "Create track"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Form */}
        <div className={`${card} p-6 space-y-5`}>
          <div className="grid gap-4 md:grid-cols-[1fr,140px]">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // if slug currently equals old auto or empty, keep it synced
                  setSlug((prev) => (prev.trim() ? prev : slugify(e.target.value)));
                }}
                placeholder="e.g., Leadership Track: Preceptor → Field Supervisor"
                className={input}
              />
              <p className="text-[11px] text-foreground/50">
                This is what managers and staff will see.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Icon
              </label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="✨"
                className={input}
              />
              <p className="text-[11px] text-foreground/50">
                Emoji works great.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder={autoSlug || "auto-generated"}
                className={input}
              />
              <p className="text-[11px] text-foreground/50">
                Used for URLs. Auto-generated from the title if left blank.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Preview
              </label>
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground/80">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/50">
                  URL
                </p>
                <p className="mt-1 break-all text-sm">
                  /dashboard/tracks/{slugToUse || "your-slug"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this track build toward? Who is it for? What’s the outcome?"
              className={textarea}
              rows={5}
            />
            <p className="text-[11px] text-foreground/50">
              Keep it simple. You can refine later.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60">
              What happens next
            </p>
            <p className="text-sm text-foreground/70">
              After you create the track, we’ll take you straight into the{" "}
              <span className="font-semibold">Builder</span> so you can add sections + modules.
              Then you can assign it to staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
