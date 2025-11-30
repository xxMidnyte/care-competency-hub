"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Competency = {
  id: string;
  org_id: string | null;
  title: string;
  description: string | null;
  risk: string | null;
  roles: string[] | null;
  setting: string | null;
  language: string | null;
  created_at: string;
};

export default function CompetenciesListPage() {
  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

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
        setError("You must be logged in to view competencies.");
        setLoading(false);
        return;
      }

      // 2) Find their org_id from organization_members (simple version)
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) {
        console.error("Error loading org membership:", membershipError);
      }

      const currentOrgId = membership?.org_id ?? null;
      setOrgId(currentOrgId);

      // 3) Load competencies for that org (or global templates if no org)
      let query = supabase
        .from("competencies")
        .select("*")
        .order("created_at", { ascending: false });

      if (currentOrgId) {
        query = query.eq("org_id", currentOrgId);
      } else {
        // fallback: show org-less/global ones
        query = query.is("org_id", null);
      }

      const { data, error: compError } = await query;

      if (compError) {
        console.error("Error loading competencies:", compError);
        setError("Failed to load competencies. Please try again.");
      } else {
        setCompetencies((data as Competency[]) || []);
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
          {competencies.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-slate-50">
                    {c.title}
                  </h2>
                  {c.risk && (
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Risk:{" "}
                      <span className="ml-1 text-amber-300">{c.risk}</span>
                    </span>
                  )}
                </div>

                {c.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">
                    {c.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(c.roles || []).map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200"
                    >
                      {r}
                    </span>
                  ))}
                  {c.setting && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-[10px] uppercase tracking-wide text-sky-300">
                      {c.setting}
                    </span>
                  )}
                  {c.language && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-[10px] uppercase tracking-wide text-emerald-300">
                      {c.language}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-end md:items-center justify-between md:flex-col gap-2 min-w-[140px] text-right">
                <p className="text-[11px] text-slate-500">
                  Created {formatDate(c.created_at)}
                </p>

                {/* Placeholder actions – we can wire these later */}
                <div className="flex gap-2 justify-end">
                  {/* In the future this could go to a /dashboard/competencies/[id] page */}
                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
                  >
                    View
                  </button>
                  {/* Could be duplicate/clone later */}
                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-sky-500 hover:text-sky-300"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
