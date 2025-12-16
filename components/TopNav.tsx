// components/TopNav.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ThemeToggle } from "./ThemeToggle";
import { useUserContext } from "@/hooks/useUserContext";

type UserInfo = {
  email: string | null;
  role: string | null;
};

const ui = {
  header:
    "sticky top-0 z-40 border-b border-border bg-background/90 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/70",
  nav: "mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3",
  brandRow: "flex items-center gap-2",
  brandLink: "flex items-center gap-2",
  brandText: "text-base sm:text-lg font-semibold tracking-tight",

  right: "flex items-center gap-3 text-sm",
  link: "text-foreground/80 hover:text-foreground transition",
  linkUnderline: "text-foreground/80 hover:text-foreground hover:underline underline-offset-4 transition",

  pill:
    "rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-card",
  rolePill:
    "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary",

  btn:
    "rounded-full border border-border bg-background px-4 py-1.5 text-[11px] font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnMini:
    "rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnPrimary:
    "rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",

  email: "hidden text-foreground/60 sm:inline",
  dividerDot: "h-1.5 w-1.5 rounded-full bg-foreground/50",
  devBadge:
    "hidden items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400 sm:inline-flex",
};

export function TopNav() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Org-aware context for dev badge + role
  const { loading: ctxLoading, context } = useUserContext();
  const org = context?.organization ?? null;
  const isDevOrg = org?.isDevOrg ?? false;

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (data.user) {
        const meta = (data.user.user_metadata || {}) as any;
        const role = meta.role || meta.user_role || "Manager";

        setUserInfo({
          email: data.user.email ?? null,
          role,
        });
      } else {
        setUserInfo(null);
      }

      setChecking(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const meta = (session.user.user_metadata || {}) as any;
        const role = meta.role || meta.user_role || "Manager";

        setUserInfo({
          email: session.user.email ?? null,
          role,
        });
      } else {
        setUserInfo(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loggedIn = !!userInfo;

  // Prefer org.role when context is ready, fall back to auth metadata
  const rawRole = (!ctxLoading && org?.role) || userInfo?.role || "Manager";
  const roleLabel = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  const dashboardLabel = roleLabel.toLowerCase() === "admin" ? "Admin dashboard" : "Manager dashboard";

  // route admins vs managers to different dashboards
  const dashboardHref = roleLabel.toLowerCase() === "admin" ? "/dashboard/admin" : "/dashboard/manager";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
    router.push("/");
  };

  return (
    <header className={ui.header}>
      <nav className={ui.nav}>
        {/* BRAND + DEV BADGE */}
        <div className={ui.brandRow}>
          <Link href="/" className={ui.brandLink}>
            <Image
              src="/logo-mark.png"
              alt="CareCompetencyHub logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
            <span className={ui.brandText}>CareCompetencyHub</span>
          </Link>

          {isDevOrg && (
            <span className={ui.devBadge}>
              <span className={ui.dividerDot} />
              Dev mode
            </span>
          )}
        </div>

        {/* NAV LINKS + INFO */}
        <div className={ui.right}>
          <ThemeToggle />

          {loggedIn && (
            <Link href={dashboardHref} className={ui.linkUnderline}>
              {dashboardLabel}
            </Link>
          )}

          {loggedIn && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className={ui.rolePill}>{roleLabel}</span>
              <span className={ui.email}>{userInfo?.email}</span>

              <button onClick={handleLogout} className={ui.btnMini}>
                Log out
              </button>
            </div>
          )}

          {!loggedIn && !checking && (
            <>
              <Link href="/login" className={ui.btn}>
                Login
              </Link>

              <Link href="/signup" className={ui.btnPrimary}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
