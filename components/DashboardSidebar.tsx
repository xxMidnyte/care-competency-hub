// components/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users2,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/facilities", label: "Facilities", icon: Building2 },
  { href: "/dashboard/staff", label: "Staff", icon: Users2 },
  { href: "/dashboard/competencies", label: "Competencies", icon: ShieldCheck },
  { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/dashboard/ai-builder", label: "AI Builder", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-slate-900 bg-slate-950">
      <div className="px-4 py-5">
        <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            CareCompetencyHub
          </p>
          <p className="mt-1 text-sm font-medium text-slate-50">Manager</p>
        </div>
      </div>

      <nav className="space-y-1 px-2 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition
                ${
                  active
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
