import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="grid gap-10 md:grid-cols-[1.1fr,1fr] md:items-center">
        {/* Left: copy + CTAs */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Healthcare competencies · simplified
          </p>

          <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl md:text-5xl">
            Keep every staff competency{" "}
            <span className="text-emerald-400">current, documented,</span>
            <br className="hidden sm:block" />
            and <span className="text-emerald-400">survey-ready.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm text-slate-300">
            CareCompetencyHub replaces scattered checklists and Excel trackers
            with one clean, real-time view of who is actually competent, who is
            in progress, and what&apos;s due next across nursing, PT/OT/SLP, and
            CNAs—so you&apos;re ready when surveyors walk in the door.
          </p>

          <div className="mt-6 flex flex-col gap-3 text-xs sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
            >
              Start a free admin account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-2.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-900"
            >
              Staff login
            </Link>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            No credit card required · Designed by a nurse consultant and
            therapist · Built for CNAs, nurses, and rehab teams
          </p>

          {/* Who it's for chips */}
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-slate-200">
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
              Nursing homes &amp; assisted living
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
              Therapy &amp; rehab clinics
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
              Homecare &amp; community teams
            </span>
          </div>
        </div>

        {/* Right: facility snapshot card */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-emerald-500/10 blur-3xl" />
          <div className="relative rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
            <div className="text-[11px] text-slate-300">
              <p className="font-semibold text-slate-100">Facility snapshot</p>
              <p className="mt-1 text-slate-400">
                Director of Nursing view · CareCompetencyHub
              </p>
            </div>

            {/* Overall compliance */}
            <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-[11px] font-semibold text-emerald-200">
                Overall compliance
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">
                93%
              </p>
              <p className="mt-1 text-[11px] text-emerald-100">
                of required competencies are current
              </p>
            </div>

            {/* Three stats row */}
            <div className="mt-3 grid gap-3 text-[11px] md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                <p className="text-slate-400">Overdue staff</p>
                <p className="mt-2 text-lg font-semibold text-amber-300">7</p>
                <p className="mt-1 text-slate-400">flagged for follow-up</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                <p className="text-slate-400">Expiring in 30 days</p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">18</p>
                <p className="mt-1 text-slate-400">
                  automatic reminders scheduled
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                <p className="text-slate-400">High-risk skills</p>
                <p className="mt-2 text-lg font-semibold text-sky-300">4</p>
                <p className="mt-1 text-slate-400">require evidence this week</p>
              </div>
            </div>

            {/* High-risk list */}
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-[11px] text-slate-200">
              <p className="font-semibold text-slate-100">
                High-risk competencies
              </p>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>• Hand hygiene — 3 staff overdue</li>
                <li>• Abuse prevention — 2 staff overdue</li>
                <li>• Medication admin — expiring soon</li>
              </ul>
            </div>

            <p className="mt-3 text-[10px] text-slate-500">
              Example data for illustration. Your dashboard reflects your actual
              staff, competencies, evidence, and reminders.
            </p>
          </div>
        </div>
      </section>

      {/* Simple 3-column teaser like your previous section */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] font-semibold text-emerald-300">
            Built for nursing homes &amp; assisted living
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Stay on top of annual competencies for CNAs, nurses, and ancillary
            staff with clear dashboards and reminders.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] font-semibold text-emerald-300">
            Therapy &amp; rehab clinics
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Track PT, OT, and SLP competencies, orientation, and ongoing skill
            checks across multiple locations.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] font-semibold text-emerald-300">
            Homecare &amp; community teams
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Know which field staff are current on required training before the
            next visit or audit.
          </p>
        </div>
      </section>
    </div>
  );
}
