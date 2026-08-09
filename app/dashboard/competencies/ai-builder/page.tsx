// app/dashboard/competencies/ai-builder/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyAIBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/ai-builder");
  }, [router]);

  return null;
}
