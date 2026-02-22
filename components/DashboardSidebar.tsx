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
  Dna,
} from "lucide-react";

type UserRole = "admin" | "manager" | "staff" | string | null;

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [hasCompletedDna, setHasCompletedDna] = useState(false);
  const [loading, setLoading] = useState(true);

  const isManager = role === "manager" || role === "admin";

  useEffect(() => {
    let cancelled = false;

    async function loadUserSession() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      // Parallel fetch for profile and DNA completion status
      const [profileRes, dnaRes] = await Promise.all([
        supabase.from("profiles").select("role, org_name").eq("id", user.id).maybeSingle(),
        supabase.from("talent_dna_results").select("id").eq("user_id", user.id).limit(1)
      ]);

      if (cancelled) return;

      if (profileRes.data) {
        setRole(profileRes.data.role);
        setOrgName(profileRes.data.org_name);
      }
      
      setHasCompletedDna(!!dnaRes.data && dnaRes.data.length > 0);
      setLoading(false);
    }

    loadUserSession();
    return () => { cancelled = true; };
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  /** * FIX: We point to the root Talent DNA folder. 
   * The page.tsx in that folder handles the internal routing logic.
   */
  const dnaHref = "/dashboard/talent-dna";

  const personalDashHref = isManager ? "/dashboard/manager" : "/dashboard/my-competencies";

  if (loading) {
    return (
      <aside className="w-[240px] border-r bg-slate-100/90 dark:bg-slate-950/95 px-3 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[240px] border-r bg-slate-100/90 text-slate-900 border-slate-200 dark:bg-slate-950/95 dark:text-slate-100 dark:border-slate-900 px-3 py-4 text-sm overflow-y-auto h-full">
      {/* HEADER */}
      <div className="mb-6 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500 dark:text-emerald-400">
          {orgName || "CareCompetencyHub"}
        </p>
        <p className="mt-1 text-[11px] text-slate-500 font-medium lowercase">
          {role ? `${role} workspace` : "user workspace"}
        </p>
      </div>

      <div className="space-y-5">
        {/* SECTION: PERSONAL */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Me</p>
          <nav className="space-y-1">
            <SidebarLink
              href={personalDashHref}
              label="My Dashboard"
              icon={<UserCircle2 className="h-4 w-4" />}
              active={isActive(personalDashHref)}
            />
            <SidebarLink
              href={dnaHref}
              label="Talent DNA"
              icon={<Dna className="h-4 w-4" />}
              active={isActive(dnaHref)}
              isNew={!hasCompletedDna}
            />
          </nav>
        </div>

        {/* SECTION: ORGANIZATION (Managers/Admins Only) */}
        {isManager && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Organization</p>
            <nav className="space-y-1">
              <SidebarLink
                href="/dashboard"
                label="Org Dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                active={pathname === "/dashboard"}
              />
              <SidebarLink
                href="/dashboard/staff"
                label="Staff Directory"
                icon={<Users className="h-4 w-4" />}
                active={isActive("/dashboard/staff")}
              />
            </nav>
          </div>
        )}

        {/* SECTION: OPERATIONS */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Operations</p>
          <nav className="space-y-1">
            <SidebarLink
              href="/dashboard/facilities"
              label="Facilities"
              icon={<Building2 className="h-4 w-4" />}
              active={isActive("/dashboard/facilities")}
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

        {/* SECTION: SETTINGS */}
        {isManager && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Admin</p>
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

function SidebarLink({ href, label, icon, active, isNew }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={classNames(
        "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] transition-all relative",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
          : "text-slate-700 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
      )}
    >
      <span className={classNames("flex h-5 w-5 items-center justify-center transition-colors", active ? "text-emerald-500" : "text-slate-400 dark:text-slate-500")}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {isNew && (
        <span className="absolute right-2 flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
      )}
    </Link>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  isNew?: boolean;
}