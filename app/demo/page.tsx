// app/demo/page.tsx

import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header (same vibe as layout / pricing / contact) */}
      <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-slate-950">
              CCH
            </span>
            <span className="text-lg font-semibold tracking-tight">
              CareCompetencyHub
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-xs">
            <Link href="/blog" className="text-slate-300 hover:text-white">
              Blog
            </Link>
            <Link href="/podcast" className="text-slate-300 hover:text-white">
              Podcast
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white">
              Contact
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="grid gap-8 md:grid-cols-[1.2fr,1fr] md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Live demo
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              See CareCompetencyHub in action in 30 minutes.
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Sit down with a nurse-led competency consultant and walk through
              how CareCompetencyHub can replace your spreadsheets, binders, and
              scattered training logs with one clean, real-time dashboard.
            </p>

            <div className="mt-4 grid gap-3 text-xs text-slate-200 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[11px] font-semibold text-emerald-300">
                  What we&apos;ll cover
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• Your current competency & training process</li>
                  <li>• Staff / role setup (RN, PT/OT/SLP, CNA, more)</li>
                  <li>• Assigning competencies & tracks</li>
                  <li>• Dashboards, reminders & survey prep</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[11px] font-semibold text-emerald-300">
                  Who should join
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• DONs, Nurse Educators, ADONs</li>
                  <li>• Rehab / Therapy Directors</li>
                  <li>• Administrators & compliance leads</li>
                  <li>• Nurse consultants</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 text-xs sm:flex-row sm:items-center">
              <a
                href="#book"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
              >
                Book a live demo
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-900"
              >
                Prefer email? Use the contact form
              </Link>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              No hard sell. Just an honest walkthrough of how we&apos;d map your
              facility into CareCompetencyHub and whether it&apos;s a fit.
            </p>
          </div>

          {/* Right card: schedule block / Calendly embed */}
          <div
            id="book"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Book time
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Pick a time that works for your team.
            </h2>
            <p className="mt-2 text-xs text-slate-300">
              Choose a 30–45 minute slot for a live walkthrough. We recommend
              inviting anyone responsible for competencies, education, or survey
              readiness.
            </p>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-400">
              <iframe
                src="https://calendly.com/carecompliancehub/30min"
                className="h-[520px] w-full rounded-lg border border-slate-800"
                frameBorder="0"
              />
            </div>

            <div className="mt-4 space-y-2 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-200">
                Helpful things to have ready:
              </p>
              <ul className="space-y-1">
                <li>
                  • Rough staff counts by role (RN / LPN / CNA / PT / OT / SLP)
                </li>
                <li>
                  • How you track competencies today (binder, Excel, LMS, etc.)
                </li>
                <li>• Any upcoming survey dates or initiatives</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What the demo looks like step-by-step */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
            <p className="text-[11px] font-semibold text-emerald-300">
              1. Quick context
            </p>
            <p className="mt-2 text-slate-300">
              We start with a 5–10 minute overview of your facility, team,
              disciplines, and how you&apos;re handling competencies today.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
            <p className="text-[11px] font-semibold text-emerald-300">
              2. Live in-app demo
            </p>
            <p className="mt-2 text-slate-300">
              We walk through staff setup, assignments, dashboards, reminders,
              and (if you want) how role-based tracks & ladders would look.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
            <p className="text-[11px] font-semibold text-emerald-300">
              3. Next steps & trial
            </p>
            <p className="mt-2 text-slate-300">
              If it feels like a fit, we spin up a 14-day trial for your
              facility and help you import your first round of staff & roles.
            </p>
          </div>
        </section>

        {/* Tiny FAQ strip */}
        <section className="grid gap-5 md:grid-cols-3 text-xs">
          <div>
            <p className="font-semibold text-slate-100">
              Is there any cost for the demo?
            </p>
            <p className="mt-1 text-slate-400">
              Nope. The demo and initial walkthrough are free. If you move
              forward, we&apos;ll talk about the plan that fits your team size.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-100">
              Do we need IT involved?
            </p>
            <p className="mt-1 text-slate-400">
              Usually not. CareCompetencyHub is web-based. If you decide to
              roll out across a larger organization, we can loop in IT later.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-100">
              Can you show PT / OT / SLP workflows too?
            </p>
            <p className="mt-1 text-slate-400">
              Yes. We can tailor the demo to nursing only, rehab only, or a
              combined nursing + therapy view depending on your setup.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
