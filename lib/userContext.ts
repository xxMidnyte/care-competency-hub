// lib/userContext.ts
import { supabase } from "@/lib/supabaseClient";

export type OrganizationRole = "dev" | "admin" | "manager" | "staff";

/**
 * Legacy JSON flag blob stored on organizations.feature_flags
 * (kept for backwards compatibility)
 */
export type FeatureFlags = {
  has_policy_module?: boolean;
  has_track_builder?: boolean;
  has_survey_shield?: boolean;
  has_ai_builder?: boolean;
  has_tracks?: boolean;
  has_deficiencies?: boolean;
  // allow future keys without breaking TS
  [key: string]: boolean | undefined;
};

/**
 * Canonical feature keys we use in the app
 * (what hasFeature() expects)
 */
export type OrgFeatureKey =
  | "policy_hub"
  | "track_builder"
  | "survey_shield"
  | "ai_builder"
  | "tracks"
  | "deficiencies";

export type OrgFeatures = Record<OrgFeatureKey, boolean>;

export type OrganizationContext = {
  organizationId: string;
  organizationName: string | null;
  role: OrganizationRole;
  isDevOrg: boolean;

  // new normalized feature map
  features: OrgFeatures;

  // legacy raw flags from organizations.feature_flags
  featureFlags: FeatureFlags;
};

export type UserContext = {
  userId: string;
  email: string | null;
  organization: OrganizationContext | null;
};

export async function getUserContext(): Promise<UserContext | null> {
  // 1) Auth user (browser supabase client has the JWT)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("getUserContext: auth error", userError);
    return null;
  }

  const userId = user.id;
  const email = user.email ?? null;

  // 2) Membership: just get org id + role, no joins
  const { data: membershipRows, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1);

  if (memberError) {
    console.error("getUserContext: membership error", memberError);
    return {
      userId,
      email,
      organization: null,
    };
  }

  if (!membershipRows || membershipRows.length === 0) {
    // Logged-in but not attached to any org yet
    return {
      userId,
      email,
      organization: null,
    };
  }

  const membership = membershipRows[0] as {
    organization_id: string;
    role: OrganizationRole;
  };

  // 3) Load organization by id
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, is_dev_org, feature_flags")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (orgError || !org) {
    console.error("getUserContext: organization error", orgError);
    return {
      userId,
      email,
      organization: null,
    };
  }

  // Raw JSON flags from the org row (may be null/undefined)
  const featureFlags: FeatureFlags = (org.feature_flags || {}) as FeatureFlags;

  // Normalized feature map used everywhere else
  const features: OrgFeatures = {
    policy_hub: !!featureFlags.has_policy_module,
    track_builder: !!featureFlags.has_track_builder,
    survey_shield: !!featureFlags.has_survey_shield,
    ai_builder: !!featureFlags.has_ai_builder,
    tracks: !!featureFlags.has_tracks,
    deficiencies: !!featureFlags.has_deficiencies,
  };

  const organizationContext: OrganizationContext = {
    organizationId: org.id,
    organizationName: org.name,
    role: membership.role,
    isDevOrg: org.is_dev_org ?? false,
    features,
    featureFlags,
  };

  return {
    userId,
    email,
    organization: organizationContext,
  };
}
