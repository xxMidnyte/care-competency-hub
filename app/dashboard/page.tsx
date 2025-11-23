'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setEmail(user.email);

      // fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_org_id')
        .eq('id', user.id)
        .single();

      if (!profile?.default_org_id) {
        router.push('/create-org');
        return;
      }

      setOrgId(profile.default_org_id);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) {
    return <p>Loading dashboard…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as {email}</p>
          <p className="text-xs text-slate-500 mt-1">
            Organization ID: {orgId}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-full border px-4 py-1.5 text-xs hover:bg-slate-100"
        >
          Log out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase font-semibold text-slate-500">Your organization</p>
          <p className="mt-2 text-sm text-slate-700">
            You are the owner. Next: invite staff to your org.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase font-semibold text-slate-500">Competencies</p>
          <p className="mt-2 text-sm text-slate-700">
            Build CNA/RN/PT competency templates.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase font-semibold text-slate-500">Assignments</p>
          <p className="mt-2 text-sm text-slate-700">
            Track overdue and upcoming competencies.
          </p>
        </div>
      </div>
    </div>
  );
}
