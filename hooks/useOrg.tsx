// hooks/useOrg.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/hooks/useUserContext";

export type OrgRole = "owner" | "admin" | "manager" | "staff" | string;

export type OrgFeatureKey =
  | "policy_hub"
  | "track_builder"
  | "survey_shield"
  | "ai_builder"
  | "tracks"
  | "deficiencies";

export type OrgFeaturesMap = Record<OrgFeatureKey, boolean>;

const DEV_ORG_ID =
  process.env.NEXT_PUBLIC_DEV_ORG_ID ?? "00000000-0000-0000-0000-000000000000";

const DEFAULT_FEATURES: OrgFeaturesMap = {
  policy_hub: false,
  track_builder: false,
  survey_shield: false,
  ai_builder: false,
  tracks: false,
  deficiencies: false,
};

export function useOrg() {
  const { loading: ctxLoading, context } = useUserContext();
  const orgContext = context?.organization ?? null;

  // whatever you store in user-context:
  // { organizationId, name, role, ... }
  const organizationId: string | null = orgContext?.organizationId ?? null;
  const role: OrgRole | null = (orgContext?.role as OrgRole) ?? null;

  const [features, setFeatures] = useState<OrgFeaturesMap>(DEFAULT_FEATURES);
  const [featuresLoading, setFeaturesLoading] = useState(false);

  useEffect(() => {
    // wait until user-context is done
    if (ctxLoading) return;
    if (!organizationId) {
      setFeatures(DEFAULT_FEATURES);
      return;
    }

    // DEV ORG → everything enabled, no DB roundtrip
    if (organizationId === DEV_ORG_ID) {
      setFeatures({
        policy_hub: true,
        track_builder: true,
        survey_shield: true,
        ai_builder: true,
        tracks: true,
        deficiencies: true,
      });
      return;
    }

    async function loadFeatures() {
      try {
        setFeaturesLoading(true);

        const { data, error } = await supabase
          .from("org_features")
          .select("feature_key, enabled")
          .eq("org_id", organizationId);

        if (error) {
          console.error("org_features load error:", error);
          setFeatures(DEFAULT_FEATURES);
          return;
        }

        const next: OrgFeaturesMap = { ...DEFAULT_FEATURES };

        (data || []).forEach((row: any) => {
          const key = row.feature_key as OrgFeatureKey;
          if (key in next) {
            next[key] = !!row.enabled;
          }
        });

        setFeatures(next);
      } finally {
        setFeaturesLoading(false);
      }
    }

    loadFeatures();
  }, [ctxLoading, organizationId]);

  return {
    loading: ctxLoading || featuresLoading,
    org: orgContext,
    organizationId,
    role,
    features,
  };
}
