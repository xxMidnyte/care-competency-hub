/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],

  // Allow dark mode via either:
  // 1) <html class="dark">
  // 2) <html data-theme="dark">
  darkMode: ["class", '[data-theme="dark"]'],

  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      // Optional: you can reference the CSS variable shadow in Tailwind
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },

  plugins: [],
};
