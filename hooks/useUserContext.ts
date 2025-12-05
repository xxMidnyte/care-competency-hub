// hooks/useUserContext.ts
"use client";

import { useEffect, useState } from "react";
import type { UserContext } from "@/lib/userContext";
import { getUserContext } from "@/lib/userContext";

export function useUserContext() {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<UserContext | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getUserContext();
        if (!cancelled) {
          setContext(data);
        }
      } catch (error) {
        console.error("Failed to load user context:", error);
        if (!cancelled) {
          setContext(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, context };
}
