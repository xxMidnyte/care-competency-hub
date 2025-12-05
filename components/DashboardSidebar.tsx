"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Settings,
  UserCircle2,
  Workflow,
  Files,
  Flag,
} from "lucide-react";

type UserRole = "admin" | "manager" | "staff" | string | null;

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  const isManager = role === "manager" || role === "admin";
  const isAdmin = role === "admin";

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, org_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profile) {
        setRole((profile as any).role ?? null);
        setOrgName((profile as any).org_name ?? null);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="
        w-[240px]
        border-r
        bg-slate-100/90 text-slate-900 border-slate-200
        dark:bg-slate-950/95 dark:text-slate-100 dark:border-slate-900
        px-3 py-4 text-sm
      "
    >
      {/* ORG / BRAND HEADER */}
      <div className="mb-6 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500 dark:text-emerald-400">
          {orgName || "CareCompetencyHub"}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {isManager ? "Manager workspace" : "Staff workspace"}
        </p>
      </div>

      <div className="space-y-5">
        {/* PERSONAL SECTION */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Me
          </p>

          <nav className="space-y-1">
            <SidebarLink
              href="/my-competencies"
              label="My dashboard"
              icon={<UserCircle2 className="h-4 w-4" />}
              active={isActive("/my-competencies")}
            />
          </nav>
        </div>

        {/* ORGANIZATION SECTION (only managers/admins) */}
        {isManager && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Organization
            </p>

            <nav className="space-y-1">
              <SidebarLink
                href="/dashboard"
                label="Org dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                active={pathname === "/dashboard"}
              />

              <SidebarLink
                href="/dashboard/manager"
                label="Manager dashboard"
                icon={<ClipboardList className="h-4 w-4" />}
                active={isActive("/dashboard/manager")}
              />
            </nav>
          </div>
        )}

        {/* OPERATIONS SECTION */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Operations
          </p>

          <nav className="space-y-1">
            <SidebarLink
              href="/dashboard/facilities"
              label="Facilities"
              icon={<Building2 className="h-4 w-4" />}
              active={isActive("/dashboard/facilities")}
            />

            <SidebarLink
              href="/dashboard/staff"
              label="Staff"
              icon={<Users className="h-4 w-4" />}
              active={isActive("/dashboard/staff")}
            />

            <SidebarLink
              href="/dashboard/competencies"
              label="Competencies"
              icon={<ShieldCheck className="h-4 w-4" />}
              active={isActive("/dashboard/competencies")}
            />

            <SidebarLink
              href="/dashboard/assignments"
              label="Assignments"
              icon={<ClipboardList className="h-4 w-4" />}
              active={isActive("/dashboard/assignments")}
            />

            <SidebarLink
              href="/dashboard/tracks"
              label="Tracks"
              icon={<Workflow className="h-4 w-4" />}
              active={isActive("/dashboard/tracks")}
            />

            <SidebarLink
              href="/dashboard/policies"
              label="PolicyBuddy"
              icon={<Files className="h-4 w-4" />}
              active={isActive("/dashboard/policies")}
            />

            {/* Survey & POCs */}
            <SidebarLink
              href="/dashboard/deficiencies"
              label="Survey & POCs"
              icon={<Flag className="h-4 w-4" />}
              active={isActive("/dashboard/deficiencies")}
            />

            <SidebarLink
              href="/dashboard/ai-builder"
              label="AI Builder"
              icon={<Sparkles className="h-4 w-4" />}
              active={isActive("/dashboard/ai-builder")}
            />
          </nav>
        </div>

        {/* SETTINGS / ADMIN SECTION */}
        {isAdmin && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Admin
            </p>
            <nav className="space-y-1">
              <SidebarLink
                href="/dashboard/settings"
                label="Settings"
                icon={<Settings className="h-4 w-4" />}
                active={isActive("/dashboard/settings")}
              />
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

function SidebarLink({ href, label, icon, active }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={classNames(
        "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center text-slate-400 dark:text-slate-500">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
