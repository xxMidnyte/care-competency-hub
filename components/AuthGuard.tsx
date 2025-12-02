// components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        setAuthed(true);
      } else {
        setAuthed(false);
        router.push("/login");
      }
      setChecking(false);
    }

    load();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setAuthed(!!session);
        if (!session) router.push("/login");
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="p-6 text-sm text-slate-400">
        Checking your session…
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
