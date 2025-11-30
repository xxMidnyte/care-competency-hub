"use client";

import { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";
import { Icon } from "@/components/ui/Icon";

interface DashboardShellProps {
  title: string;
  children: ReactNode;
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-950/80 px-4 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
            <Icon name="check" variant="solid" size={16} className="text-slate-950" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">CareCompetencyHub</span>
            <span className="text-xs text-slate-400">Manager</span>
          </div>
        </div>

        <SidebarNav />

        <div className="mt-auto pt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} CCH
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

          <div className="flex items-center gap-3">
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
              <Icon name="notifications" variant="line" size={18} />
            </button>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700">
              <Icon name="profile" variant="line" size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-slate-950 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
