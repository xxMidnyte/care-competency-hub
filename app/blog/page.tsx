// app/blog/page.tsx
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Blog
        </p>
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
          Nurse-led ideas for better competencies.
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Articles from a nurse consultant and therapist on building competency
          programs that actually work in the real world—less theory, more
          checklists, templates, and “do this on Monday” steps.
        </p>
      </section>

      {/* Upcoming / placeholder posts */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Featured series: False Beliefs about Competencies
        </h2>
        <p className="text-xs text-slate-400">
          We&apos;re recording a podcast + blog series on common assumptions
          that keep facilities stuck in spreadsheet chaos. Full archive coming
          soon—here&apos;s a preview of what&apos;s planned.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1 */}
          <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-300">
              False Belief #1
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-50">
              “We already track competencies in a spreadsheet, so we’re fine.”
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              Why spreadsheets quietly break once you have multiple units,
              disciplines, and survey expectations—and what a real system needs
              to show readiness at a glance.
            </p>
            <p className="mt-3 text-[11px] text-slate-500">
              Article &amp; episode coming soon.
            </p>
          </article>

          {/* Card 2 */}
          <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-300">
              False Belief #2
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-50">
              “Competencies are a once-a-year task, not an ongoing process.”
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              How to move from painful annual checkoffs to a rolling,
              survey-ready process that actually supports clinical growth.
            </p>
            <p className="mt-3 text-[11px] text-slate-500">
              Article &amp; episode coming soon.
            </p>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-100">
            Want to see this in action instead?
          </p>
          <p className="mt-1 text-slate-300">
            Book a short demo and we&apos;ll walk through how CareCompetencyHub
            can replace your spreadsheets today.
          </p>
        </div>
        <Link
          href="/demo"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Book a live demo
        </Link>
      </section>
    </div>
  );
}
