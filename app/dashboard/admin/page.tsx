"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Facility = {
  id: string;
  name: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1) Auth check
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setEmail(user.email ?? null);

        // 2) Load org_id for this user
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
          setError("Unable to load your profile.");
          return;
        }

        if (!profile?.org_id) {
          setError("No organization found for this account.");
          return;
        }

        setOrgId(profile.org_id);

        // 3) Load facilities for this org
        const { data: facilityRows, error: facilityError } = await supabase
          .from("facilities")
          .select("id, name")
          .eq("org_id", profile.org_id)
          .order("name", { ascending: true });

        if (facilityError) {
          console.error(facilityError);
          setError("Unable to load facilities.");
          return;
        }

        setFacilities(facilityRows ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Loading admin dashboard…
        </h1>
        <p className="text-sm text-slate-300">
          Fetching your organization and facilities.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Admin dashboard
        </h1>
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50">
          Admin dashboard (coming soon)
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          We&apos;re still building the full admin view for multi-facility
          operators. For now, you can manage facilities and staff from the
          manager dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200">
        <p className="font-semibold text-slate-100">
          Signed in as{" "}
          <span className="font-mono text-emerald-300">
            {email ?? "unknown"}
          </span>
        </p>
        <p className="mt-1 text-slate-300">
          Org ID:{" "}
          <span className="font-mono text-slate-200">
            {orgId ?? "not set"}
          </span>
        </p>

        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-400">
            Facilities (read-only preview)
          </p>
          {facilities.length === 0 ? (
            <p className="mt-1 text-[11px] text-slate-500">
              No facilities found yet for this organization.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-[11px]">
              {facilities.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2"
                >
                  {f.name || "Unnamed facility"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
