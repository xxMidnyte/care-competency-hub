"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ThemeToggle } from "./ThemeToggle";

type UserInfo = {
  email: string | null;
  role: string | null;
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();

      if (!mounted) return;

      if (data.user) {
        const meta = (data.user.user_metadata || {}) as any;
        const role =
          meta.role ||
          meta.user_role ||
          "Manager";

        setUserInfo({
          email: data.user.email ?? null,   // ✅ FIX 1
          role,
        });
      } else {
        setUserInfo(null);
      }

      setChecking(false);
    }

    load();

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const meta = (session.user.user_metadata || {}) as any;
        const role =
          meta.role ||
          meta.user_role ||
          "Manager";

        setUserInfo({
          email: session.user.email ?? null,  // ✅ FIX 2
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

  const roleLabel = userInfo?.role ?? "Manager";
  const dashboardLabel =
    roleLabel.toLowerCase() === "admin"
      ? "Admin dashboard"
      : "Manager dashboard";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
    router.push("/");
  };

  return (
    <header className="border-b border-slate-900 bg-slate-950/95 text-slate-100 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* BRAND */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-mark.png"
            alt="CareCompetencyHub logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">
            CareCompetencyHub
          </span>
        </Link>

        {/* NAV LINKS + INFO */}
        <div className="flex items-center gap-3 text-sm">
          {/* THEME TOGGLE */}
          <ThemeToggle />

          {/* Dashboard link */}
          {loggedIn && (
            <Link
              href="/dashboard"
              className="text-slate-200 hover:text-white hover:underline"
            >
              {dashboardLabel}
            </Link>
          )}

          {/* Logged-in display */}
          {loggedIn && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-300">
                {roleLabel}
              </span>

              <span className="hidden text-slate-400 sm:inline">
                {userInfo?.email}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-700 px-3 py-1 text-slate-100 hover:bg-slate-800"
              >
                Log out
              </button>
            </div>
          )}

          {/* Logged-out state */}
          {!loggedIn && !checking && (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-700 px-4 py-1.5 text-slate-100 hover:bg-slate-800"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-emerald-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
