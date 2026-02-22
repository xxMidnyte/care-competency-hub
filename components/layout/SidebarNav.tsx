"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabaseClient";

export function SidebarNav() {
  const pathname = usePathname();
  const [hasCompletedDna, setHasCompletedDna] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [dnaRes, profileRes] = await Promise.all([
        supabase.from("talent_dna_results").select("id").eq("user_id", user.id).limit(1),
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      ]);

      setHasCompletedDna(!!dnaRes.data && dnaRes.data.length > 0);
      if (profileRes.data) setRole(profileRes.data.role);
    }
    checkUserStatus();
  }, []);

  /**
   * REVISED NAVIGATION LOGIC:
   * We point the link to the base /talent-dna page. 
   * That page (which we just created) handles the logic of 
   * showing the Manager Table vs. the Staff Welcome Screen.
   */
  const dnaRootPath = "/dashboard/talent-dna";

  const navItems = [
    { label: "My dashboard", href: "/dashboard/manager", icon: "dashboard" as IconName },
    { label: "Facilities", href: "/dashboard/manager/facilities", icon: "facilities" as IconName },
    { label: "Staff", href: "/dashboard/manager/staff", icon: "staff" as IconName },
    { label: "Competencies", href: "/dashboard/manager/competencies", icon: "competencies" as IconName },
    { label: "Assignments", href: "/dashboard/manager/assignments", icon: "assignments" as IconName },
    { label: "Tracks", href: "/dashboard/manager/tracks", icon: "tracks" as IconName },
    { 
      label: "Talent DNA", 
      href: dnaRootPath, 
      icon: "ai-bolt" as IconName, 
      isAi: true 
    },
    { label: "PolicyBuddy", href: "/dashboard/manager/policy-buddy", icon: "policy" as IconName },
    { label: "Survey & POCs", href: "/dashboard/manager/deficiencies", icon: "survey" as IconName },
    { label: "AI Builder", href: "/dashboard/manager/ai-builder", icon: "ai-bolt" as IconName },
    { label: "Settings", href: "/dashboard/manager/settings", icon: "settings" as IconName },
  ];

  return (
    <nav className="mt-4 space-y-1 text-sm">
      {navItems.map((item) => {
        // Updated active state logic to handle sub-routes (like /quiz or /results)
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
              active
                ? "bg-emerald-500/15 text-emerald-300 font-medium"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-emerald-200"
            } ${item.isAi && !active ? "text-indigo-300" : ""}`}
          >
            <Icon 
              name={item.icon} 
              variant="line" 
              size={22} 
              className={item.isAi && !active ? "text-indigo-400" : "shrink-0"} 
            />
            <span className="flex-1">{item.label}</span>
            
            {/* Show "NEW" badge only if it's the DNA link and they haven't finished it */}
            {item.isAi && item.label === "Talent DNA" && !hasCompletedDna && (
              <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30 animate-pulse">
                NEW
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}