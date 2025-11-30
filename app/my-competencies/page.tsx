"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type MyCompetency = {
  id: string;
  status: string;
  due_at: string | null;
  facility_name: string | null;
  competency_title: string;
  risk_level: string | null;
};

export default function MyCompetenciesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [items, setItems] = useState<MyCompetency[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Auth check
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // 2) Find staff member linked to this auth user
      const { data: staff, error: staffError } = await supabase
        .from("staff_members")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .single();

      if (staffError || !staff) {
        console.error("No staff record", staffError);
        setError(
          "Your login is not linked to a staff record yet. Ask an admin to connect your account."
        );
        setLoading(false);
        return;
      }

      setStaffName(staff.full_name);

      // 3) Load this staff member's competencies across facilities
      const { data, error: compError } = await supabase
        .from("staff_competencies")
        .select(
          `
          id,
          status,
          due_at,
          facilities:facilities ( name ),
          competencies:competencies ( title, risk_level )
        `
        )
        .eq("staff_id", staff.id)
        .order("due_at", { ascending: true });

      if (compError) {
        console.error("Staff competencies error", compError);
        setError("Failed to load your competencies.");
        setLoading(false);
        return;
      }

      const normalized: MyCompetency[] =
        (data ?? []).map((row: any) => ({
          id: row.id,
          status: row.status,
          due_at: row.due_at,
          facility_name: row.facilities?.name ?? null,
          competency_title: row.competencies?.title ?? "Untitled competency",
          risk_level: row.competencies?.risk_level ?? null,
        })) ?? [];

      setItems(normalized);
      setLoading(false);
    }

    load();
  }, [router]);

  // simple counts
  const now = new Date();
  const overdueCount = items.filter((i) => i.status === "overdue").length;
  const completeCount = items.filter((i) => i.status === "complete").length;
  const pendingCount = items.filter(
    (i) => i.status !== "complete" && i.status !== "overdue"
  ).length;

  if (loading) {
    return <p className="text-slate-300">Loading your competencies…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">
          My competencies
        </h1>
        {staffName && (
          <p className="text-sm text-slate-400">Signed in as {staffName}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* Summary tiles */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-xs uppercase text-slate-400 font-semibold">
                Overdue
              </p>
              <p className="mt-2 text-3xl font-bold text-rose-300">
                {overdueCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-xs uppercase text-slate-400 font-semibold">
                Pending
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-200">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-xs uppercase text-slate-400 font-semibold">
                Complete
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {completeCount}
              </p>
            </div>
          </div>

          {/* List */}
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
            <p className="text-xs uppercase text-slate-400 font-semibold mb-3">
              All assignments
            </p>

            {items.length === 0 ? (
              <p className="text-sm text-slate-400">
                No competencies assigned yet.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {items.map((item) => {
                  const dueLabel =
                    item.due_at && !isNaN(new Date(item.due_at).getTime())
                      ? new Date(item.due_at).toLocaleDateString()
                      : "N/A";

                  const isOverdue = item.status === "overdue";
                  const isComplete = item.status === "complete";

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1 rounded-xl bg-slate-900/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-50">
                          {item.competency_title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.facility_name ?? "Unknown facility"} • Due{" "}
                          {dueLabel}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {item.risk_level && (
                          <span className="rounded-full bg-slate-800 px-2 py-1 uppercase tracking-wide">
                            {item.risk_level}
                          </span>
                        )}
                        <span
                          className={[
                            "rounded-full px-2 py-1 font-semibold uppercase tracking-wide",
                            isOverdue
                              ? "bg-rose-500/80 text-rose-50"
                              : isComplete
                              ? "bg-emerald-500/80 text-emerald-950"
                              : "bg-amber-400/80 text-amber-950",
                          ].join(" ")}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
