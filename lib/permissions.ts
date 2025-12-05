// lib/permissions.ts
import type { OrganizationContext, OrganizationRole } from "./userContext";
import type { OrgFeatureKey } from "@/hooks/useOrg";

export const ROLE_RANK: Record<OrganizationRole, number> = {
  dev: 4,
  admin: 3,
  manager: 2,
  staff: 1,
};

export function hasRoleAtLeast(
  organization: OrganizationContext | null,
  required: OrganizationRole
): boolean {
  if (!organization) return false;

  const userRank = ROLE_RANK[organization.role];
  const requiredRank = ROLE_RANK[required];

  // Dev in dev org: unrestricted access
  if (organization.role === "dev" && organization.isDevOrg) return true;

  return userRank >= requiredRank;
}

export function hasFeature(
  organization: OrganizationContext | null,
  featureKey: OrgFeatureKey
): boolean {
  if (!organization) return false;

  // Dev in dev org: all features ON
  if (organization.role === "dev" && organization.isDevOrg) return true;

  return Boolean(organization.features?.[featureKey]);
}
