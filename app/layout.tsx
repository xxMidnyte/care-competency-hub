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
  // Added print:p-0 to ensure the main content uses the full paper width
  main: "mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8 sm:py-10 print:px-0 print:py-4",
  // Added no-print to hide the footer on paper
  footer: "border-t border-border bg-background no-print",
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
          
          {/* 1. HIDE TOP NAV ON PRINT */}
          <div className="no-print">
            <TopNav />
          </div>

          {/* 2. PRINT-ONLY WATERMARK/HEADER 
              This only shows up on the paper, making it look like a formal document.
          */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-8">
            <div className="flex items-center gap-2">
               <Image src="/logo-mark.png" alt="Logo" width={24} height={24} />
               <span className="font-bold text-sm tracking-tight text-slate-900">CareCompetencyHub</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Talent DNA Report</p>
              <p className="text-[8px] text-slate-300 font-mono">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <main className={ui.main}>{children}</main>

          {/* 3. FOOTER IS NOW HIDDEN ON PRINT */}
          <footer className={ui.footer}>
            <div className={ui.footerWrap}>
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
                  rehab teams.
                </p>

                <p className={ui.footerFine}>
                  Made by nurses &amp; therapists in Minnesota. 💚
                </p>
              </div>

              <div className="grid flex-1 gap-6 text-[12px] md:grid-cols-3">
                <div>
                  <h3 className={ui.footerTitle}>Product</h3>
                  <ul className="mt-3 space-y-2">
                    <li><Link href="/pricing" className={ui.footerLink}>Pricing</Link></li>
                    <li><Link href="/demo" className={ui.footerLink}>Book a demo</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className={ui.footerTitle}>Resources</h3>
                  <ul className="mt-3 space-y-2">
                    <li><Link href="/blog" className={ui.footerLink}>Blog</Link></li>
                    <li><Link href="/help" className={ui.footerLink}>Help & FAQs</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className={ui.footerTitle}>Legal</h3>
                  <ul className="mt-3 space-y-2">
                    <li><Link href="/terms" className={ui.footerLink}>Terms</Link></li>
                    <li><Link href="/privacy" className={ui.footerLink}>Privacy</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}