'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // 1. Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Add user as OWNER in org
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          org_id: org.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // 3. Update profile default_org_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          default_org_id: org.id
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Create your organization</h1>
      <p className="mt-1 text-sm text-slate-600">
        This is usually your clinic, nursing home, or facility.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-700">Organization name</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. St. Cloud Rehab & Homecare"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create organization'}
        </button>
      </form>
    </div>
  );
}
