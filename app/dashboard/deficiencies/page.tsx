"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";
import { PlusCircle, Flag } from "lucide-react";

type Deficiency = {
  id: string;
  org_id: string;
  facility_id: string | null;
  title: string | null;
  tag_code: string | null;
  severity: string | null;
  scope: string | null;
  deficiency_text: string;
  survey_date: string | null;
  status: string;
};

export default function DeficiencyListPage() {
  const router = useRouter();

  // ---- ORG CONTEXT ----
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";

  const isDevOrg = org?.isDevOrg ?? false;
  const hasDefModule = org?.featureFlags?.has_deficiency_module ?? false;
  const hasModuleAccess = isDevOrg || hasDefModule;

  const canManage =
    userRole === "dev" ||
    userRole === "admin" ||
    userRole === "manager";

  // ---- PAGE STATE ----
  const [loading, setLoading] = useState(true);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ---- LOAD DATA ----
  useEffect(() => {
    async function load() {
      if (orgLoading) return;

      try {
        setLoading(true);
        setError(null);

        if (!organizationId || !org) {
          setError("Unable to load your organization.");
          return;
        }

        if (!hasModuleAccess) {
          setError("The deficiency module is not enabled for your organization.");
          return;
        }

        // Staff CAN view deficiencies — only control actions like "new"
        const {
          data: defRows,
          error: defError,
        } = await supabase
          .from("survey_deficiencies")
          .select("*")
          .eq("org_id", organizationId)
          .order("survey_date", { ascending: false });

        if (defError) {
          setError("Could not load survey deficiencies.");
          return;
        }

        setDeficiencies(defRows ?? []);
      } catch (err) {
        console.error("Deficiency load error:", err);
        setError("Something went wrong loading deficiencies.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    orgLoading,
    org,
    organizationId,
    hasModuleAccess,
  ]);

  // ---- HANDLERS ----
  const openNewForm = () => {
    if (!canManage) return;
    router.push("/dashboard/deficiencies/new");
  };

  // ---- LOADING ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="p-6 text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  // ---- ACCESS ERRORS ----
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="p-6 max-w-2xl space-y-3">
          <h1 className="text-xl font-semibold">Survey Deficiencies</h1>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // ---- MAIN PAGE ----
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Survey Deficiencies &amp; POCs
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track state survey tags and manage Plans of Correction.
            </p>
          </div>

          {canManage && (
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              <PlusCircle className="h-4 w-4" />
              Add deficiency
            </button>
          )}
        </div>

        {/* TABLE PANEL */}
        <section className="rounded-xl border border-slate-200 bg-[var(--surface-soft)] p-4 shadow-sm">
          {deficiencies.length === 0 ? (
            <p className="text-sm text-slate-500">
              No survey deficiencies recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2 text-left">Tag</th>
                    <th className="px-2 py-2 text-left">Title</th>
                    <th className="px-2 py-2 text-left">Severity</th>
                    <th className="px-2 py-2 text-left">Survey date</th>
                    <th className="px-2 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deficiencies.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-slate-200 last:border-b-0 hover:bg-slate-900/5"
                    >
                      <td className="px-2 py-2 font-medium text-emerald-500">
                        <Link
                          href={`/dashboard/deficiencies/${d.id}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <Flag className="h-3 w-3" />
                          <span>{d.tag_code || "-"}</span>
                        </Link>
                      </td>

                      <td className="px-2 py-2">
                        <Link
                          href={`/dashboard/deficiencies/${d.id}`}
                          className="hover:underline text-[var(--foreground)]"
                        >
                          {d.title || "Untitled"}
                        </Link>
                      </td>

                      <td className="px-2 py-2 text-slate-600">
                        {d.severity || "-"}
                      </td>

                      <td className="px-2 py-2 text-slate-600">
                        {d.survey_date || "-"}
                      </td>

                      <td className="px-2 py-2">
                        <span className="inline-flex rounded-md border border-slate-300 bg-[var(--surface)] px-2 py-1 text-xs text-slate-700">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
