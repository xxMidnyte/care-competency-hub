"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/ui/Icon";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/manager", icon: "dashboard" },
  { label: "Facilities", href: "/dashboard/manager/facilities", icon: "facilities" },
  { label: "Staff", href: "/dashboard/manager/staff", icon: "staff" },
  { label: "Competencies", href: "/dashboard/manager/competencies", icon: "competencies" },
  { label: "Assignments", href: "/dashboard/manager/assignments", icon: "assignments" },
  { label: "AI Builder", href: "/dashboard/manager/ai-builder", icon: "ai-bolt" },
  { label: "Settings", href: "/dashboard/manager/settings", icon: "settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 space-y-1 text-sm">
      {navItems.map((item) => {
        const active = pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-xl px-3 py-2 transition",
              active
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-emerald-200",
            ].join(" ")}
          >
            <Icon name={item.icon} variant="line" size={22} className="shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
