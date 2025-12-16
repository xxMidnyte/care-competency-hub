// app/help/page.tsx
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="px-6 py-4 space-y-10">
      {/* HERO */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Help & FAQs
        </p>

        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl tracking-tight">
          Answers to common questions.
        </h1>

        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Everything you need to know about using CareCompetencyHub — from setup
          to assigning competencies to walking into surveys with confidence.
        </p>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
          {[
            ["#what-is-cch", "What it is"],
            ["#disciplines", "Disciplines"],
            ["#pricing", "Pricing"],
            ["#evidence", "Evidence"],
            ["#support", "Support"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border bg-card px-3 py-1.5 font-semibold text-foreground/80 shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
            >
              {label}
            </a>
          ))}
        </div>
      </section>

      {/* FAQ LIST (static for now) */}
      <section className="space-y-4">
        <FaqCard
          id="what-is-cch"
          title="What is CareCompetencyHub?"
          body={
            <>
              It’s a competency & compliance hub built specifically for nursing,
              rehab, and multi-disciplinary teams. Instead of juggling spreadsheets,
              binders, and email reminders, everything — competencies, due dates,
              evidence uploads, tracks, and checkoffs — lives in one clean place.
            </>
          }
        />

        <FaqCard
          id="disciplines"
          title="Do you support multiple disciplines?"
          body={
            <>
              Yes. CCH supports RN, LPN, CNA, PT, OT, SLP, and multi-facility
              operator workflows. Each role gets its own track templates,
              assignments, and evidence options.
            </>
          }
        />

        <FaqCard
          id="pricing"
          title="How does pricing work?"
          body={
            <>
              Pricing is based on active staff tracked. Smaller clinics start at
              $99/month, facilities at $149/month, and enterprise options are
              available for multi-facility operators. Details are on our{" "}
              <Link
                href="/pricing"
                className="text-primary hover:opacity-90 underline underline-offset-4"
              >
                pricing page
              </Link>
              .
            </>
          }
        />

        <FaqCard
          id="evidence"
          title="Can we upload evidence and checkoffs?"
          body={
            <>
              Yes — staff or managers can upload documents, images, or PDFs.
              Everything is stored with audit-ready timestamps and tied to the
              competency and staff member.
            </>
          }
        />

        <FaqCard
          id="support"
          title="Is there onboarding or support?"
          body={
            <>
              Absolutely. You can email us anytime at{" "}
              <a
                href="mailto:info@carecompetencyhub.com"
                className="text-primary hover:opacity-90 underline underline-offset-4"
              >
                info@carecompetencyhub.com
              </a>
              , or book a personalized onboarding session through our{" "}
              <Link
                href="/demo"
                className="text-primary hover:opacity-90 underline underline-offset-4"
              >
                demo calendar
              </Link>
              .
            </>
          }
        />
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-border bg-card shadow-card p-4 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">
            Still need help? We’re here for you.
          </p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Reach out anytime — we read every message, and we’re happy to help.
          </p>
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
        >
          Contact support
        </Link>
      </section>
    </div>
  );
}

function FaqCard({
  id,
  title,
  body,
}: {
  id: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="rounded-2xl border border-border bg-card shadow-card p-5 transition hover:bg-muted/40"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
        FAQ
      </p>
      <h3 className="mt-2 font-semibold text-foreground text-sm">{title}</h3>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
