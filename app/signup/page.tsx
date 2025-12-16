// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ui = {
  page:
    "min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-4",
  card:
    "w-full max-w-md rounded-2xl border border-border bg-card shadow-card p-4 space-y-5",
  kicker:
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-xl font-semibold tracking-tight text-foreground",
  p: "text-xs text-muted-foreground",
  label: "text-xs font-medium text-muted-foreground",
  input:
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent",
  btnPrimary:
    "w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  alert:
    "rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-foreground",
  link:
    "text-primary hover:opacity-90 underline underline-offset-4",
};

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message || "Failed to create account.");
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
      });

      if (
        profileError &&
        !String(profileError.message || "")
          .toLowerCase()
          .includes("duplicate")
      ) {
        console.error("Profile insert error:", profileError);
      }
    }

    router.push("/dashboard");
  }

  return (
    <div className={ui.page}>
      <form onSubmit={handleSignup} className={ui.card}>
        <div className="space-y-1">
          <p className={ui.kicker}>Create account</p>
          <h1 className={ui.h1}>Create an admin account</h1>
          <p className={ui.p}>
            You’ll use this to manage your facility in CareCompetencyHub.
          </p>
        </div>

        {error && (
          <div className={ui.alert}>
            <p className="font-semibold text-rose-400">
              Couldn’t create your account
            </p>
            <p className="mt-1 text-xs text-foreground/80">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={ui.label}>Email</label>
            <input
              className={ui.input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@facility.com"
            />
          </div>

          <div className="space-y-1">
            <label className={ui.label}>Password</label>
            <input
              className={ui.input}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: use a unique password for work accounts.
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading} className={ui.btnPrimary}>
          {loading ? "Creating account…" : "Create account"}
        </button>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/login" className={ui.link}>
              Sign in
            </Link>
          </p>
          <a href="mailto:info@carecompetencyhub.com" className={ui.link}>
            Email support
          </a>
        </div>
      </form>
    </div>
  );
}
