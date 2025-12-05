// components/PremiumFeatureGuard.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useUserContext } from "@/hooks/useUserContext";
import { hasFeature } from "@/lib/permissions";
import type { OrgFeatureKey } from "@/lib/userContext";

type PremiumFeatureGuardProps = {
  feature: OrgFeatureKey;
  title: string;
  description?: string;
  children: ReactNode;
};

export function PremiumFeatureGuard({
  feature,
  title,
  description,
  children,
}: PremiumFeatureGuardProps) {
  const { loading, context } = useUserContext();
  const org = context?.organization ?? null;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[var(--surface-soft)] p-4 text-sm text-slate-400">
        Loading access…
      </div>
    );
  }

  const enabled = hasFeature(org, feature);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-[var(--surface-soft)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Premium feature locked
        </p>
        <h2 className="mt-2 text-base font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {description ??
            "This module isn’t enabled for your organization yet. Talk to your admin or upgrade your plan to unlock it."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            View plans
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1.5 text-slate-100 hover:bg-slate-800"
          >
            Book a walkthrough
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
