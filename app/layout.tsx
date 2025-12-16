// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { TopNav } from "@/components/TopNav";

export const metadata = {
  title: "CareCompetencyHub",
  description: "Competency & compliance hub for healthcare teams.",
};

const ui = {
  body: "min-h-screen antialiased bg-background text-foreground",
  shell: "flex min-h-screen flex-col",
  main: "mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8 sm:py-10",
  footer: "border-t border-border bg-background",
  footerWrap:
    "mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 py-8 md:flex-row md:items-start md:justify-between",
  footerTitle:
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60",
  footerLink: "text-foreground/80 hover:text-primary transition",
  footerMuted: "text-foreground/60",
  footerFine: "text-[11px] text-foreground/50",
  divider: "border-t border-border",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ui.body}>
        <div className={ui.shell}>
          {/* TOP NAVBAR (client component handles auth + theme toggle) */}
          <TopNav />

          {/* MAIN CONTENT */}
          <main className={ui.main}>{children}</main>

          {/* FOOTER */}
          <footer className={ui.footer}>
            <div className={ui.footerWrap}>
              {/* Brand + tagline */}
              <div className="space-y-3">
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

                <p className={`max-w-sm text-[12px] leading-relaxed ${ui.footerMuted}`}>
                  Nurse-led competency &amp; compliance tooling for nursing and
                  rehab teams. Built for people who are tired of spreadsheets,
                  binders, and &quot;we&apos;ll find it later.&quot;
                </p>

                <p className={ui.footerFine}>
                  Made by nurses &amp; therapists in Minnesota. 💚
                </p>
              </div>

              {/* Navigation columns */}
              <div className="grid flex-1 gap-6 text-[12px] md:grid-cols-3">
                <div>
                  <h3 className={ui.footerTitle}>Product</h3>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link href="/pricing" className={ui.footerLink}>
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link href="/demo" className={ui.footerLink}>
                        Book a demo
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className={ui.footerLink}>
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={ui.footerTitle}>Resources</h3>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link href="/blog" className={ui.footerLink}>
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="/podcast" className={ui.footerLink}>
                        Podcast
                      </Link>
                    </li>
                    <li>
                      <Link href="/help" className={ui.footerLink}>
                        Help & FAQs
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={ui.footerTitle}>Contact</h3>
                  <div className="mt-3 space-y-2">
                    <p className="text-[12px]">
                      Email{" "}
                      <a
                        href="mailto:info@carecompetencyhub.com"
                        className="font-mono text-primary hover:opacity-90 transition"
                      >
                        info@carecompetencyhub.com
                      </a>
                    </p>
                    <p className={ui.footerFine}>
                      Prefer a call? Book a time on our{" "}
                      <Link href="/demo" className="text-primary hover:opacity-90 transition">
                        demo calendar
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={ui.divider}>
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:px-6 py-4 text-[11px] text-foreground/50 sm:flex-row">
                <p>© {new Date().getFullYear()} CareCompetencyHub. All rights reserved.</p>
                <div className="flex gap-4">
                  <Link href="/terms" className="hover:text-primary transition">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:text-primary transition">
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
