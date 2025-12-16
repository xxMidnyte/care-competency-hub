'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

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
        .update({ default_org_id: org.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Setup
          </p>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Create your organization
          </h1>
          <p className="text-sm text-foreground/60">
            This is usually your clinic, nursing home, or facility.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60">
              Organization name
            </label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. St. Cloud Rehab & Homecare"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
              <p className="font-semibold text-red-500">
                Couldn’t create organization
              </p>
              <p className="mt-1 text-xs text-foreground/80">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
          >
            {loading ? 'Creating…' : 'Create organization'}
          </button>
        </form>
      </div>
    </div>
  );
}
