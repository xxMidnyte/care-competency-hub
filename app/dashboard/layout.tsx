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
        <div className="flex-1 border-l border-slate-900 bg-slate-950">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
