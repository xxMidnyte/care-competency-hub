// components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "cch-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Helper to apply theme to <html>
  const applyTheme = (next: Theme) => {
    const root = document.documentElement;

    // your CSS variables are driven by data-theme
    root.dataset.theme = next;

    // keep Tailwind's dark: variants in sync
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    window.localStorage.setItem(STORAGE_KEY, next);
  };

  // On mount: pick initial theme (saved → system preference → default)
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initial: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : prefersDark
        ? "dark"
        : "light";

    applyTheme(initial);
    setTheme(initial);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  // Avoid hydration mismatch flash
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="h-8 w-8 rounded-full border border-slate-700/60 bg-black/10"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center gap-1 rounded-full border border-slate-700/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <span>{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="hidden sm:inline">
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
