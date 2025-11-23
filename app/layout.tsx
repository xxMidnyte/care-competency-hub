// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CareCompetencyHub",
  description: "Competency & compliance hub for healthcare teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-slate-950">
                CCH
              </span>
              <span className="text-lg font-semibold tracking-tight">
                CareCompetencyHub
              </span>
            </Link>

            <div className="flex gap-3 text-sm">
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
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
