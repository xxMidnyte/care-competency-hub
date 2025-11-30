// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="space-y-6">
        {/* Top chip spanning full width */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Keep your facility survey-ready without living in spreadsheets
          </div>
        </div>

        {/* Main hero content */}
        <div className="grid gap-10 lg:grid-cols-[1.3fr,1fr] items-start">
          {/* Left: copy + CTAs */}
          <div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
              Pass surveys with confidence.{" "}
              <br className="hidden sm:block" />
              Track competencies without the chaos.
            </h1>

            <p className="mt-4 max-w-xl text-sm text-slate-300">
              CareCompetencyHub replaces scattered checklists and Excel trackers
              with one clean, real-time view of who is actually competent, who
              is in progress, and what&apos;s due next across nursing,
              PT/OT/SLP, and CNAs.
            </p>

            <div className="mt-6 flex flex-col gap-3 text-xs sm:flex-row sm:items-center">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
              >
                Get a live demo
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-900"
              >
                View pricing
              </Link>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              No credit card required. Designed with a nurse consultant and
              therapist for SNFs, LTCs, clinics, and hospital units.
            </p>

            {/* Who it's for chips */}
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-slate-200">
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                Directors of Nursing &amp; ADONs
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                Nurse Educators
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                Rehab / Therapy Directors
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                Nurse consultants &amp; operators
              </span>
            </div>
          </div>

          {/* Right: faux dashboard preview */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 rounded-[32px] bg-emerald-500/10 blur-3xl" />
            <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-semibold text-slate-100">
                  Survey readiness dashboard
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-1 font-mono text-[10px] text-emerald-300">
                  92% compliant
                </span>
              </div>

              {/* Top stats */}
              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3">
                  <p className="text-[11px] text-slate-400">Due in 30 days</p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">14</p>
                  <p className="mt-1 text-[11px] text-emerald-300">
                    Auto-reminders scheduled
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3">
                  <p className="text-[11px] text-slate-400">Past due items</p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">4</p>
                  <p className="mt-1 text-[11px] text-amber-300">
                    All assigned to owners
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3">
                  <p className="text-[11px] text-slate-400">New hires</p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">3</p>
                  <p className="mt-1 text-[11px] text-sky-300">
                    Onboarding tracks in progress
                  </p>
                </div>
              </div>

              {/* Table-ish preview */}
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Staff &amp; key tracks</span>
                  <span className="rounded-full bg-slate-950 px-2 py-1">
                    Filter: High-risk skills
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-[11px]">
                  {[
                    {
                      name: "J. Anderson, RN",
                      track: "Charge Nurse Readiness",
                      status: "On track • 2 of 8 skills left",
                      badgeClass: "text-emerald-300 bg-emerald-500/10",
                    },
                    {
                      name: "M. Lopez, PT",
                      track: "High-acuity neuro",
                      status: "1 critical skill due",
                      badgeClass: "text-amber-300 bg-amber-500/10",
                    },
                    {
                      name: "S. Carter, CNA",
                      track: "New hire core",
                      status: "Checkoff scheduled Fri",
                      badgeClass: "text-sky-300 bg-sky-500/10",
                    },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-slate-100">
                          {row.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {row.track}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-medium ${row.badgeClass}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[10px] text-slate-500">
                Example data for illustration. Your dashboard reflects your
                actual staff, competencies, evidence, and tracks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-outcome strip */}
      <section className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-xs md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold text-emerald-300">
            Walk into surveys calmer
          </p>
          <p className="mt-1 text-slate-300">
            One place to show surveyors who&apos;s checked off, who&apos;s in
            progress, and what your plan is for gaps — without digging through
            binders.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-emerald-300">
            Give staff a clear path
          </p>
          <p className="mt-1 text-slate-300">
            Tracks and ladders show nurses and therapists exactly what they need
            to do to move into charge, specialty, or leadership roles.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-emerald-300">
            Get out of spreadsheet hell
          </p>
          <p className="mt-1 text-slate-300">
            Replace manual sorting and color-coding with live filters,
            reminders, and a simple readiness percentage for each facility.
          </p>
        </div>
      </section>
    </div>
  );
}
