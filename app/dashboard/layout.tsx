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
      <div className="flex min-h-[calc(100vh-56px)] bg-background text-foreground">
        <DashboardSidebar />
        <div className="flex-1 border-l border-border bg-background">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
