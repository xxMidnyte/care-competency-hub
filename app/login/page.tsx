// app/login/page.tsx
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

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className={ui.page}>
      <form onSubmit={handleSubmit} className={ui.card}>
        <div className="space-y-1">
          <p className={ui.kicker}>Sign in</p>
          <h1 className={ui.h1}>Welcome back</h1>
          <p className={ui.p}>
            Use your work email and password to access your dashboard.
          </p>
        </div>

        {error && (
          <div className={ui.alert}>
            <p className="font-semibold text-rose-400">
              Couldn’t sign you in
            </p>
            <p className="mt-1 text-xs text-foreground/80">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={ui.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ui.input}
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@facility.com"
            />
          </div>

          <div className="space-y-1">
            <label className={ui.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={ui.input}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={ui.btnPrimary}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <p>
            Need an account?{" "}
            <Link href="/signup" className={ui.link}>
              Create one
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
