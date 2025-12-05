// app/dashboard/competencies/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompetenciesListPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/library");
  }, [router]);

  return null;
}
