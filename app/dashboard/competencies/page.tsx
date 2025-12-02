"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type CompetencyTemplate = {
  id: string;
  org_id: string | null;
  title: string | null;
  description: string | null;
  risk: string | null;
  roles: string[] | null;
  setting: string | null;
  language: string | null;
  created_at: string;
};

type UserRole = "admin" | "manager" | "staff" | string | null;

function riskBadgeColor(risk: string | null | undefined) {
  const v = (risk || "").toLowerCase();

  if (v === "critical") return "text-amber-300";
  if (v === "high") return "text-red-300";
  if (v === "medium") return "text-yellow-200";
  return "text-emerald-300";
}

export default function CompetenciesListPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState<CompetencyTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User load error:", userError);
        setError("You must be logged in to view competencies.");
        setLoading(false);
        return;
      }

      // 2) Get org_id + role from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id, role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.org_id) {
        console.error("Error loading profile / org_id:", profileError);
        setError("Unable to load organization.");
        setLoading(false);
        return;
      }

      const currentOrgId = profile.org_id as string;
      setOrgId(currentOrgId);
      setUserRole((profile as any).role ?? null);

      // 3) Load competency templates for this org
      const { data, error: compError } = await supabase
        .from("competency_templates")
        .select(
          "id, org_id, title, description, risk, roles, setting, language, created_at"
        )
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (compError) {
        console.error("Error loading competencies:", compError);
        setError("Failed to load competencies. Please try again.");
      } else {
        setCompetencies((data as CompetencyTemplate[]) || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canDelete = userRole === "admin" || userRole === "manager";

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this competency? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    const { error: deleteError } = await supabase
      .from("competency_templates")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (deleteError) {
      console.error("Error deleting competency:", deleteError);
      setError("Failed to delete competency. Please try again.");
    } else {
      setCompetencies((prev) => prev.filter((c) => c.id !== id));
    }

    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Competency library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            All competencies created for{" "}
            <span className="font-medium">
              {orgId ? "your organization" : "shared templates"}
            </span>
            .
          </p>
        </div>

        <Link
          href="/dashboard/competencies/ai-builder"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          ✨ New with AI
        </Link>
      </div>

      {/* Status / error */}
      <div className="mt-4">
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            Loading competencies…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && competencies.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm text-slate-300">
            <p className="font-medium">No competencies yet.</p>
            <p className="mt-1 text-slate-400">
              Click{" "}
              <span className="font-semibold text-emerald-400">
                “New with AI”
              </span>{" "}
              to generate your first competency for this org.
            </p>
          </div>
        )}
      </div>

      {/* List */}
      {!loading && !error && competencies.length > 0 && (
        <div className="mt-6 grid gap-4">
          {competencies.map((c) => {
            const roles = c.roles || [];
            const settings = c.setting ? [c.setting] : [];
            const lang = c.language || "";
            const riskValue = c.risk || null;

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-slate-50">
                      {c.title || "Untitled competency"}
                    </h2>
                    {riskValue && (
                      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        Risk:{" "}
                        <span className={`ml-1 ${riskBadgeColor(riskValue)}`}>
                          {riskValue}
                        </span>
                      </span>
                    )}
                  </div>

                  {c.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">
                      {c.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200"
                      >
                        {r}
                      </span>
                    ))}
                    {settings.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-300"
                      >
                        {s}
                      </span>
                    ))}
                    {lang && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                        {lang}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-end md:items-center justify-between md:flex-col gap-2 min-w-[200px] text-right">
                  <p className="text-[11px] text-slate-500">
                    Created {formatDate(c.created_at)}
                  </p>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/library/${c.id}`)}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/library/${c.id}?mode=assign`)
                      }
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-sky-500 hover:text-sky-300"
                    >
                      Use
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="rounded-lg border border-rose-700 px-3 py-1 text-xs text-rose-200 hover:bg-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete competency"
                      >
                        {deletingId === c.id ? "…" : "🗑"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
