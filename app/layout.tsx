// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { TopNav } from "@/components/TopNav";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen flex-col">
          {/* TOP NAVBAR (now handled by TopNav client component) */}
          <TopNav />

          {/* MAIN CONTENT */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
            {children}
          </main>

          {/* FOOTER (same as before) */}
          <footer className="border-t border-slate-800 site-footer">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between">
              {/* Brand + tagline */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo-mark.png"
                    alt="CareCompetencyHub logo"
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <span className="text-base font-semibold tracking-tight">
                    CareCompetencyHub
                  </span>
                </div>
                <p className="max-w-sm text-[12px] leading-relaxed text-slate-400">
                  Nurse-led competency &amp; compliance tooling for nursing and
                  rehab teams. Built for people who are tired of spreadsheets,
                  binders, and &quot;we&apos;ll find it later.&quot;
                </p>
                <p className="text-[11px] text-slate-500">
                  Made by nurses &amp; therapists in Minnesota. 💚
                </p>
              </div>

              {/* Navigation columns */}
              <div className="grid flex-1 gap-6 text-[12px] md:grid-cols-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Product
                  </h3>
                  <ul className="mt-3 space-y-2 text-slate-300">
                    <li>
                      <Link href="/pricing" className="hover:text-emerald-300">
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link href="/demo" className="hover:text-emerald-300">
                        Book a demo
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="hover:text-emerald-300">
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Resources
                  </h3>
                  <ul className="mt-3 space-y-2 text-slate-300">
                    <li>
                      <Link href="/blog" className="hover:text-emerald-300">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="/podcast" className="hover:text-emerald-300">
                        Podcast
                      </Link>
                    </li>
                    <li>
                      <Link href="/help" className="hover:text-emerald-300">
                        Help & FAQs
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Contact
                  </h3>
                  <div className="mt-3 space-y-2 text-slate-300">
                    <p className="text-[12px]">
                      Email{" "}
                      <a
                        href="mailto:info@carecompetencyhub.com"
                        className="font-mono text-emerald-300 hover:text-emerald-200"
                      >
                        info@carecompetencyhub.com
                      </a>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Prefer a call? Book a time on our{" "}
                      <Link
                        href="/demo"
                        className="text-emerald-300 hover:text-emerald-200"
                      >
                        demo calendar
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-slate-500 sm:flex-row">
                <p>
                  © {new Date().getFullYear()} CareCompetencyHub. All rights
                  reserved.
                </p>
                <div className="flex gap-4">
                  <Link href="/terms" className="hover:text-emerald-300">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:text-emerald-300">
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
