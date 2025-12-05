// components/RequireRole.tsx
"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { OrganizationRole } from "@/lib/userContext";
import { hasRoleAtLeast } from "@/lib/permissions";
import { useUserContext } from "@/hooks/useUserContext";

type RequireRoleProps = {
  minRole: OrganizationRole;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
};

export function RequireRole({
  minRole,
  children,
  fallback = null,
  redirectTo,
}: RequireRoleProps) {
  const router = useRouter();
  const { loading, context } = useUserContext();

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Checking your access…
      </div>
    );
  }

  const hasAccess = hasRoleAtLeast(context?.organization ?? null, minRole);

  if (!hasAccess) {
    if (redirectTo) {
      router.replace(redirectTo);
      return null;
    }
    return (
      fallback ?? (
        <p className="text-sm text-red-500">
          You don’t have permission to view this page.
        </p>
      )
    );
  }

  return <>{children}</>;
}
