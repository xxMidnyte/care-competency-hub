// app/manager/assign/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Facility = {
  id: string;
  name: string | null;
};

type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Competency = {
  id: string;
  title: string | null;
  risk_level: string | null;
};

export default function ManagerAssignPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | "">("");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | "">("");

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string | "">(
    ""
  );

  const [dueDate, setDueDate] = useState<string>("");

  // Initial load: auth + org + facilities + competencies
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Auth check
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error", userError);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);

      // 2) Load profile to get org
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("default_org_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error", profileError);
        setError("Unable to load your profile.");
        setLoading(false);
        return;
      }

      if (!profile?.default_org_id) {
        router.push("/create-org");
        return;
      }

      const orgId = profile.default_org_id as string;
      setOrgId(orgId);

      // 3) Load facilities for this org
      const { data: facs, error: facError } = await supabase
        .from("facilities")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (facError) {
        console.error("Facilities error", facError);
        setError("Failed to load facilities.");
        setLoading(false);
        return;
      }

      const facList = (facs ?? []) as Facility[];
      setFacilities(facList);

      if (facList.length) {
        setSelectedFacilityId(facList[0].id);
      }

      // 4) Load competencies for this org
      const { data: comps, error: compError } = await supabase
        .from("competencies")
        .select("id, title, risk_level")
        .eq("org_id", orgId)
        .order("risk_level", { ascending: false })
        .order("title", { ascending: true });

      if (compError) {
        console.error("Competencies error", compError);
        setError("Failed to load competencies.");
        setLoading(false);
        return;
      }

      const compList = (comps ?? []) as Competency[];
      setCompetencies(compList);
      if (compList.length) {
        setSelectedCompetencyId(compList[0].id);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  // Load staff when facility changes
  useEffect(() => {
    async function loadStaff() {
      if (!selectedFacilityId || !orgId) return;

      setStaff([]);
      setSelectedStaffId("");
      setError(null);

      const { data, error: staffError } = await supabase
        .from("staff_members")
        .select("id, full_name, email")
        .eq("org_id", orgId)
        .eq("facility_id", selectedFacilityId)
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (staffError) {
        console.error("Staff error", staffError);
        setError("Failed to load staff for this facility.");
        return;
      }

      const staffList = (data ?? []) as StaffMember[];
      setStaff(staffList);
      if (staffList.length) {
        setSelectedStaffId(staffList[0].id);
      }
    }

    loadStaff();
  }, [selectedFacilityId, orgId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId || !orgId) {
      setError("Missing auth context.");
      return;
    }

    if (!selectedFacilityId || !selectedStaffId || !selectedCompetencyId) {
      setError("Please choose a facility, staff member, and competency.");
      return;
    }

    if (!dueDate) {
      setError("Please choose a due date.");
      return;
    }

    setSaving(true);

    // Insert a new staff_competencies row and return its id
    const { data, error: insertError } = await supabase
      .from("staff_competencies")
      .insert({
        org_id: orgId,
        facility_id: selectedFacilityId,
        staff_id: selectedStaffId,
        competency_id: selectedCompetencyId,
        status: "assigned",
        due_at: new Date(dueDate).toISOString(),
        assigned_by: userId,
        source: "manager",
      })
      .select("id")
      .single();

    if (insertError || !data) {
      console.error("Insert error", insertError);
      setSaving(false);
      setError("Failed to assign competency.");
      return;
    }

    // Fire email function (best-effort)
    try {
      await supabase.functions.invoke("send_competency_assignment", {
        body: { staff_competency_id: data.id },
      });
    } catch (fnErr) {
      console.error("send_competency_assignment error", fnErr);
      // Optional: could set a soft warning instead of failing the whole flow
    }

    setSaving(false);
    setSuccess("Competency assigned successfully.");
  }

  if (loading) {
    return <p className="text-sm text-slate-200">Loading manager tools…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manager – Assign competencies</h1>
          <p className="text-sm text-slate-300">Signed in as {email}</p>
          {orgId && (
            <p className="mt-1 text-xs text-slate-500">Org ID: {orgId}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-rose-500/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
      >
        {/* Facility + due date */}
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Facility
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || "Unnamed facility"}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Staff + competency */}
        <div className="grid gap-2 md:grid-cols-2">
          {/* Staff */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Staff member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.email || "Unnamed staff"}
                </option>
              ))}
            </select>
          </div>

          {/* Competency */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Competency
            </label>
            <select
              value={selectedCompetencyId}
              onChange={(e) => setSelectedCompetencyId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || "Untitled competency"}{" "}
                  {c.risk_level ? `(${c.risk_level})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? "Assigning…" : "Assign competency"}
          </button>
        </div>
      </form>
    </div>
  );
}
