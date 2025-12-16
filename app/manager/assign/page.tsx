// app/manager/assign/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";

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

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-4xl px-6 py-10 space-y-6",
  kicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-2xl font-semibold tracking-tight",
  p: "text-sm text-foreground/70",
  mini: "text-xs text-foreground/60",
  inputLabel:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  input:
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]",
  formGrid: "grid gap-3 md:grid-cols-2",
  msgErr:
    "rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100",
  msgOk:
    "rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100",
  btnPrimary:
    "inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  cardPad: "p-6",
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

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) console.error("Auth error", userError);

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);

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
      if (facList.length) setSelectedFacilityId(facList[0].id);

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
      if (compList.length) setSelectedCompetencyId(compList[0].id);

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
      if (staffList.length) setSelectedStaffId(staffList[0].id);
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

    try {
      await supabase.functions.invoke("send_competency_assignment", {
        body: { staff_competency_id: data.id },
      });
    } catch (fnErr) {
      console.error("send_competency_assignment error", fnErr);
    }

    setSaving(false);
    setSuccess("Competency assigned successfully.");
  }

  if (loading) {
    return (
      <div className={ui.page}>
        <div className={ui.wrap}>
          <p className="text-sm text-foreground/70">Loading manager tools…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        {/* Header */}
        <div className="flex flex-col gap-2">
          <p className={ui.kicker}>Manager</p>
          <h1 className={ui.h1}>Assign competencies</h1>
          <p className={ui.p}>
            Signed in as <span className="font-medium text-foreground">{email}</span>
          </p>
          {orgId && <p className={ui.mini}>Org ID: {orgId}</p>}
        </div>

        {/* Messages */}
        {error && <div className={ui.msgErr}>{error}</div>}
        {success && <div className={ui.msgOk}>{success}</div>}

        {/* Form */}
        <Card className={ui.cardPad}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={ui.formGrid}>
              <div className="space-y-1">
                <label className={ui.inputLabel}>Facility</label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className={ui.input}
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || "Unnamed facility"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={ui.inputLabel}>Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={ui.input}
                />
              </div>
            </div>

            <div className={ui.formGrid}>
              <div className="space-y-1">
                <label className={ui.inputLabel}>Staff member</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className={ui.input}
                >
                  {staff.length === 0 ? (
                    <option value="">No active staff found</option>
                  ) : (
                    staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.email || "Unnamed staff"}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className={ui.inputLabel}>Competency</label>
                <select
                  value={selectedCompetencyId}
                  onChange={(e) => setSelectedCompetencyId(e.target.value)}
                  className={ui.input}
                >
                  {competencies.length === 0 ? (
                    <option value="">No competencies found</option>
                  ) : (
                    competencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || "Untitled competency"}
                        {c.risk_level ? ` (${c.risk_level})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving} className={ui.btnPrimary}>
                {saving ? "Assigning…" : "Assign competency"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
