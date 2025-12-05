"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";
const STORAGE_KEY = "cch-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (next: Theme) => {
    const root = document.documentElement;

    // Keep your old behavior (CSS variables)
    root.dataset.theme = next;

    // Keep Tailwind dark mode
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    window.localStorage.setItem(STORAGE_KEY, next);
  };

  // Initialize theme
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

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
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="h-8 w-16 rounded-full border border-slate-700 bg-slate-900"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex h-8 w-16 items-center rounded-full border border-slate-700 bg-slate-900 px-1 transition-all"
    >
      <span
        className={`absolute h-6 w-6 rounded-full bg-slate-100 shadow transition-transform ${
          theme === "light" ? "translate-x-8" : "translate-x-0"
        }`}
      />

      <span className="flex-1 flex justify-center">
        <Moon className={`h-4 w-4 ${theme === "dark" ? "text-sky-200" : "text-slate-500"}`} />
      </span>
      <span className="flex-1 flex justify-center">
        <Sun className={`h-4 w-4 ${theme === "light" ? "text-amber-300" : "text-slate-500"}`} />
      </span>
    </button>
  );
}
