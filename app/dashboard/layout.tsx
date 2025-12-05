// app/dashboard/layout.tsx
"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-56px)]">
        <DashboardSidebar />
        <div
          className="
            flex-1
            border-l
            bg-slate-50 text-slate-900 border-slate-200
            dark:bg-slate-950 dark:text-slate-100 dark:border-slate-900
          "
        >
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
