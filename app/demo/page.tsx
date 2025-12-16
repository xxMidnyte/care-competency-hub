// app/demo/page.tsx
import Link from "next/link";

const primaryBtnLg =
  "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-[11px] font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

const secondaryBtnLg =
  "inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-[11px] font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

export default function DemoPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[1.2fr,1fr] md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Live demo
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl tracking-tight">
            See CareCompetencyHub in action in 30 minutes.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Sit down with a nurse-led competency consultant and walk through how
            CareCompetencyHub can replace your spreadsheets, binders, and
            scattered training logs with one clean, real-time dashboard.
          </p>

          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card shadow-card p-4">
              <p className="text-[11px] font-semibold text-primary">
                What we&apos;ll cover
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Your current competency & training process</li>
                <li>• Staff / role setup (RN, PT/OT/SLP, CNA, more)</li>
                <li>• Assigning competencies & tracks</li>
                <li>• Dashboards, reminders & survey prep</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-card p-4">
              <p className="text-[11px] font-semibold text-primary">
                Who should join
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• DONs, Nurse Educators, ADONs</li>
                <li>• Rehab / Therapy Directors</li>
                <li>• Administrators & compliance leads</li>
                <li>• Nurse consultants</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 text-xs sm:flex-row sm:items-center">
            <a href="#book" className={primaryBtnLg}>
              Book a live demo
            </a>
            <Link href="/contact" className={secondaryBtnLg}>
              Prefer email? Use the contact form
            </Link>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            No hard sell. Just an honest walkthrough of how we&apos;d map your
            facility into CareCompetencyHub and whether it&apos;s a fit.
          </p>
        </div>

        {/* Schedule block / Calendly embed */}
        <div
          id="book"
          className="rounded-2xl border border-border bg-card shadow-card p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Book time
          </p>
          <h2 className="mt-2 text-sm font-semibold text-foreground">
            Pick a time that works for your team.
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Choose a 30–45 minute slot for a live walkthrough. We recommend
            inviting anyone responsible for competencies, education, or survey
            readiness.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-card-2 p-2 text-xs text-muted-foreground">
            <iframe
              title="Book a demo"
              src="https://calendly.com/carecompliancehub/30min"
              className="h-[520px] w-full rounded-lg border border-border bg-background"
              frameBorder="0"
            />
          </div>

          <div className="mt-4 space-y-2 text-[11px] text-muted-foreground">
            <p className="font-semibold text-foreground">
              Helpful things to have ready:
            </p>
            <ul className="space-y-1">
              <li>• Rough staff counts by role (RN / LPN / CNA / PT / OT / SLP)</li>
              <li>• How you track competencies today (binder, Excel, LMS, etc.)</li>
              <li>• Any upcoming survey dates or initiatives</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card shadow-card p-4 text-xs">
          <p className="text-[11px] font-semibold text-primary">1. Quick context</p>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We start with a 5–10 minute overview of your facility, team,
            disciplines, and how you&apos;re handling competencies today.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-4 text-xs">
          <p className="text-[11px] font-semibold text-primary">2. Live in-app demo</p>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We walk through staff setup, assignments, dashboards, reminders, and
            (if you want) how role-based tracks & ladders would look.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-4 text-xs">
          <p className="text-[11px] font-semibold text-primary">3. Next steps & trial</p>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            If it feels like a fit, we spin up a 14-day trial for your facility
            and help you import your first round of staff & roles.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-5 md:grid-cols-3 text-xs">
        <div className="rounded-2xl border border-border bg-card shadow-card p-4">
          <p className="font-semibold text-foreground">
            Is there any cost for the demo?
          </p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Nope. The demo and initial walkthrough are free. If you move forward,
            we&apos;ll talk about the plan that fits your team size.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-4">
          <p className="font-semibold text-foreground">Do we need IT involved?</p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Usually not. CareCompetencyHub is web-based. If you decide to roll out
            across a larger organization, we can loop in IT later.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-4">
          <p className="font-semibold text-foreground">
            Can you show PT / OT / SLP workflows too?
          </p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Yes. We can tailor the demo to nursing only, rehab only, or a combined
            nursing + therapy view depending on your setup.
          </p>
        </div>
      </section>
    </div>
  );
}
