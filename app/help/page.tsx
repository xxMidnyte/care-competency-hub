// app/help/page.tsx
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Help & FAQs
        </p>

        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
          Answers to common questions.
        </h1>

        <p className="max-w-2xl text-sm text-slate-300">
          Everything you need to know about using CareCompetencyHub — from setup
          to assigning competencies to walking into surveys with confidence.
        </p>
      </section>

      {/* FAQ ACCORDION STYLE (static for now) */}
      <section className="space-y-4">
        {/* FAQ ITEM */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="font-semibold text-slate-100 text-sm">
            What is CareCompetencyHub?
          </h3>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            It’s a competency & compliance hub built specifically for nursing,
            rehab, and multi-disciplinary teams. Instead of juggling spreadsheets,
            binders, and email reminders, everything — competencies, due dates,
            evidence uploads, tracks, and checkoffs — lives in one clean place.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="font-semibold text-slate-100 text-sm">
            Do you support multiple disciplines?
          </h3>
          <p className="mt-2 text-xs text-slate-300">
            Yes. CCH supports RN, LPN, CNA, PT, OT, SLP, and multi-facility
            operator workflows. Each role gets its own track templates,
            assignments, and evidence options.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="font-semibold text-slate-100 text-sm">
            How does pricing work?
          </h3>
          <p className="mt-2 text-xs text-slate-300">
            Pricing is based on active staff tracked. Smaller clinics start at
            $99/month, facilities at $149/month, and enterprise options are
            available for multi-facility operators. Details are on our{" "}
            <Link href="/pricing" className="text-emerald-300 hover:text-emerald-200">
              pricing page
            </Link>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="font-semibold text-slate-100 text-sm">
            Can we upload evidence and checkoffs?
          </h3>
          <p className="mt-2 text-xs text-slate-300">
            Yes — staff or managers can upload documents, images, or PDFs.
            Everything is stored with audit-ready timestamps and tied to the
            competency and staff member.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="font-semibold text-slate-100 text-sm">
            Is there onboarding or support?
          </h3>
          <p className="mt-2 text-xs text-slate-300">
            Absolutely. You can email us anytime at{" "}
            <a
              href="mailto:info@carecompetencyhub.com"
              className="text-emerald-300 hover:text-emerald-200"
            >
              info@carecompetencyhub.com
            </a>
            , or book a personalized onboarding session through our{" "}
            <Link href="/demo" className="text-emerald-300 hover:text-emerald-200">
              demo calendar
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-100">
            Still need help? We’re here for you.
          </p>
          <p className="mt-1 text-slate-300">
            Reach out anytime — we read every message, and we’re happy to help.
          </p>
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-[11px] font-semibold text-slate-100 hover:bg-slate-900"
        >
          Contact support
        </Link>
      </section>
    </div>
  );
}
