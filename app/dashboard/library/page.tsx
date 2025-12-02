"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type CompetencyTemplate = {
  id: string;
  title: string | null;
  risk_level: string | null;
  created_at: string;
  // with Supabase we may have other optional columns,
  // but we'll treat them as `any` at runtime.
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

export default function CompetencyLibraryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState<CompetencyTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(userError);
        setError("Not logged in.");
        setLoading(false);
        return;
      }

      // 2) Get org_id from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.org_id) {
        console.error(profileError);
        setError("Unable to load organization.");
        setLoading(false);
        return;
      }

      const orgId = profile.org_id as string;

      // 3) Load competency templates for org
      // (If you also have global templates, you could OR in org_id is null.)
      const { data, error: compError } = await supabase
        .from("competency_templates")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (compError) {
        console.error(compError);
        setError("Unable to load competencies.");
        setLoading(false);
        return;
      }

      setCompetencies((data as CompetencyTemplate[]) || []);
      setLoading(false);
    }

    load();
  }, []);

  const hasCompetencies = competencies.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            Competency library
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            All competencies created for{" "}
            <span className="font-medium text-slate-200">
              shared templates.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            // Send them to your AI builder / new competency page.
            // Adjust this route to whatever you are using.
            router.push("/dashboard/ai-builder");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          <span className="text-lg">✨</span>
          <span>New with AI</span>
        </button>
      </header>

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
            <span className="font-medium text-emerald-300">New with AI</span>{" "}
            button to generate your first template, or add one manually.
          </p>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && hasCompetencies && (
        <div className="space-y-4">
          {competencies.map((c) => {
            const risk = c.risk_level || "low";
            const created = c.created_at
              ? new Date(c.created_at).toLocaleDateString()
              : "";

            // Optional tag groups if you’ve added them in your DB.
            const roles: string[] = (c.roles as string[]) || [];
            const settings: string[] = (c.settings as string[]) || [];
            const language = (c.language as string) || "";
            const tags: string[] = [
              ...roles,
              ...settings,
              ...(language ? [language] : []),
            ];

            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-sm"
              >
                {/* Left: title + tags */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-slate-50">
                      {c.title || "Untitled competency"}
                    </h2>

                    <div
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${riskBadgeClasses(
                        risk
                      )}`}
                    >
                      <span className="mr-1 text-[10px] uppercase text-slate-400">
                        Risk:
                      </span>
                      <span>{risk}</span>
                    </div>
                  </div>

                  {/* Tags row – only render if something exists */}
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
                <div className="ml-6 flex items-center gap-4">
                  <div className="hidden text-xs text-slate-400 sm:block">
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
