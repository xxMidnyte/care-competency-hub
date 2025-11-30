// app/podcast/page.tsx
import Link from "next/link";

export default function PodcastPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Podcast
        </p>
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
          The CareCompetencyHub Podcast.
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Short, practical conversations about competencies, clinical ladders,
          survey prep, and how to build systems that support nurses,
          therapists, and CNAs—without burning everyone out.
        </p>
      </section>

      {/* Season card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-sm">
        <p className="text-[11px] font-semibold text-emerald-300">
          Season 1 · False Beliefs about Competencies
        </p>
        <h2 className="mt-2 text-sm font-semibold text-slate-50">
          Breaking the myths that keep your competency program stuck.
        </h2>
        <p className="mt-2 text-xs text-slate-300">
          Each episode tackles one “false belief” we hear from facilities all
          the time—from “the spreadsheet is fine” to “competencies are just a
          survey checkbox”—and walks through what to do instead.
        </p>

        <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Episode 1 · “The spreadsheet is good enough.”
            </p>
            <p className="mt-1 text-slate-300">
              Why spreadsheets quietly fall apart with turnover, new units, and
              multiple disciplines—and simple ways to start cleaning it up.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Recording soon · Blog version coming to the{" "}
              <Link href="/blog" className="text-emerald-300 hover:text-emerald-200">
                blog
              </Link>
              .
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Episode 2 · “Competencies are just once a year.”
            </p>
            <p className="mt-1 text-slate-300">
              How ongoing tracks, micro-checkoffs, and role-based ladders make
              surveys easier—and staff happier.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Recording soon · Part of the False Beliefs series.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-100">
            Want to be a beta guest or get early access?
          </p>
          <p className="mt-1 text-slate-300">
            We&apos;re lining up early episodes with DONs, educators, and rehab
            leaders. Tell us a “false belief” you&apos;d like us to tackle.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-[11px] font-semibold text-slate-100 hover:bg-slate-900"
        >
          Pitch an episode
        </Link>
      </section>
    </div>
  );
}
