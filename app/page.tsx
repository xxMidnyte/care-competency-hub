import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="hero-shell grid gap-10 md:grid-cols-[1.1fr,1fr] md:items-center">
        {/* Left: copy + CTAs */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
            Healthcare competencies · simplified
          </p>

          <h1 className="hero-title mt-3 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Keep every staff competency{" "}
            <span className="text-emerald-500">current, documented,</span>
            <br className="hidden sm:block" />
            and <span className="text-emerald-500">survey-ready.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm text-[var(--foreground)]/80">
            CareCompetencyHub replaces scattered checklists and Excel trackers
            with one clean, real-time view of who is actually competent, who is
            in progress, and what&apos;s due next across nursing, PT/OT/SLP, and
            CNAs—so you&apos;re ready when surveyors walk in the door.
          </p>

          {/* Primary CTAs */}
          <div className="mt-8 flex flex-col items-center gap-4 text-sm sm:flex-row sm:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 text-sm sm:text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              Start a free admin account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-[var(--foreground)]/20 bg-white/80 px-7 py-3 text-sm sm:text-base font-medium text-slate-900 shadow-sm transition hover:bg-white"
            >
              Staff login
            </Link>
          </div>

          <p className="mt-3 text-[11px] text-[var(--foreground)]/60 text-center sm:text-left">
            No credit card required · Designed by a nurse consultant and
            therapist · Built for CNAs, nurses, and rehab teams
          </p>

          {/* Who it's for chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[12px] text-[var(--foreground)] sm:justify-start">
            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/60">
              Built for:
            </span>
            <span className="rounded-full border border-[var(--foreground)]/20 bg-[var(--surface-soft)] px-4 py-2 text-[12px] font-medium shadow-sm">
              Nursing homes &amp; assisted living
            </span>
            <span className="rounded-full border border-[var(--foreground)]/20 bg-[var(--surface-soft)] px-4 py-2 text-[12px] font-medium shadow-sm">
              Therapy &amp; rehab clinics
            </span>
            <span className="rounded-full border border-[var(--foreground)]/20 bg-[var(--surface-soft)] px-4 py-2 text-[12px] font-medium shadow-sm">
              Homecare &amp; community teams
            </span>
          </div>
        </div>

        {/* Right: facility snapshot card */}
        <div className="relative">
          {/* Glow */}
          <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-emerald-500/10 blur-3xl" />

          <div className="relative rounded-3xl border border-[var(--foreground)]/10 bg-[var(--surface)] p-5 shadow-xl">
            <div className="text-[11px] text-[var(--foreground)]/70">
              <p className="font-semibold text-[var(--foreground)]">
                Facility snapshot
              </p>
              <p className="mt-1 text-[var(--foreground)]/60">
                Director of Nursing view · CareCompetencyHub
              </p>
            </div>

            {/* Overall compliance */}
            <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
                Overall compliance
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600 dark:text-emerald-300">
                93%
              </p>
              <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-100">
                of required competencies are current
              </p>
            </div>

            {/* Three stats row */}
            <div className="mt-3 grid gap-3 text-[11px] md:grid-cols-3">
              <div className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--surface-soft)] p-3">
                <p className="text-[var(--foreground)]/60">Overdue staff</p>
                <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-300">
                  7
                </p>
                <p className="mt-1 text-[var(--foreground)]/60">
                  flagged for follow-up
                </p>
              </div>

              <div className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--surface-soft)] p-3">
                <p className="text-[var(--foreground)]/60">Expiring in 30 days</p>
                <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                  18
                </p>
                <p className="mt-1 text-[var(--foreground)]/60">
                  automatic reminders scheduled
                </p>
              </div>

              <div className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--surface-soft)] p-3">
                <p className="text-[var(--foreground)]/60">High-risk skills</p>
                <p className="mt-2 text-lg font-semibold text-sky-600 dark:text-sky-300">
                  4
                </p>
                <p className="mt-1 text-[var(--foreground)]/60">
                  require evidence this week
                </p>
              </div>
            </div>

            {/* High-risk list */}
            <div className="mt-4 rounded-2xl border border-[var(--foreground)]/15 bg-[var(--surface)] p-3 text-[11px] text-[var(--foreground)]/80">
              <p className="font-semibold text-[var(--foreground)]">
                High-risk competencies
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Hand hygiene — 3 staff overdue</li>
                <li>• Abuse prevention — 2 staff overdue</li>
                <li>• Medication admin — expiring soon</li>
              </ul>
            </div>

            <p className="mt-3 text-[10px] text-[var(--foreground)]/50">
              Example data for illustration. Your dashboard reflects your actual
              staff, competencies, evidence, and reminders.
            </p>
          </div>
        </div>
      </section>

      {/* 3-column teaser */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--foreground)]/15 bg-[var(--surface)] p-4">
          <p className="text-[11px] font-semibold text-emerald-500">
            Built for nursing homes &amp; assisted living
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/80">
            Stay on top of annual competencies for CNAs, nurses, and ancillary
            staff with clear dashboards and reminders.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--foreground)]/15 bg-[var(--surface)] p-4">
          <p className="text-[11px] font-semibold text-emerald-500">
            Therapy &amp; rehab clinics
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/80">
            Track PT, OT, and SLP competencies, orientation, and ongoing skill
            checks across multiple locations.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--foreground)]/15 bg-[var(--surface)] p-4">
          <p className="text-[11px] font-semibold text-emerald-500">
            Homecare &amp; community teams
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/80">
            Know which field staff are current on required training before the
            next visit or audit.
          </p>
        </div>
      </section>
    </div>
  );
}
