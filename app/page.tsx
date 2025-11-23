// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Healthcare competencies · simplified
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Keep every staff competency{" "}
            <span className="block text-emerald-400">
              current, documented, and survey-ready.
            </span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-300 md:text-base">
            CareCompetencyHub helps nursing homes, clinics, and homecare agencies
            assign, track, and document staff competencies in one place — so
            you&apos;re ready when surveyors walk in the door.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/signup"
              className="rounded-full bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400"
            >
              Start a free admin account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-6 py-2.5 font-medium text-slate-100 hover:bg-slate-900"
            >
              Staff login
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            No credit card required · Designed by a practicing therapist · Built
            for CNAs, nurses, and rehab teams
          </p>
        </div>

        {/* PRODUCT PREVIEW CARD */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/40">
          <p className="text-sm font-semibold text-slate-50">
            Facility snapshot
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Director of Nursing view · CareCompetencyHub
          </p>

          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-xl bg-emerald-950/60 p-4 ring-1 ring-emerald-800">
              <p className="text-xs font-semibold uppercase text-emerald-300">
                Overall compliance
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-400">
                93%
              </p>
              <p className="text-xs text-emerald-200/80">
                of required competencies are current
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Overdue staff"
                value="7"
                accent="text-rose-400"
                helper="flagged for follow-up"
              />
              <StatCard
                label="Expiring in 30 days"
                value="18"
                accent="text-amber-300"
                helper="automatic reminders scheduled"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                High-risk competencies
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-200">
                <li>• Hand hygiene – 3 staff overdue</li>
                <li>• Abuse prevention – 2 staff overdue</li>
                <li>• Medication admin – expiring soon</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-50">
            Built for real-world healthcare teams
          </h2>
          <p className="text-xs text-slate-400">
            Start in one building, then roll out across your organization.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Nursing homes & assisted living"
            body="Stay on top of annual competencies for CNAs, nurses, and ancillary staff with clear dashboards and reminders."
          />
          <Card
            title="Therapy & rehab clinics"
            body="Track PT, OT, and SLP competencies, orientation, and ongoing skill checks across multiple locations."
          />
          <Card
            title="Homecare & community teams"
            body="Know which field staff are current on required training before the next visit or audit."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-50">
          Everything in one competency hub
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            title="Centralized competency library"
            body="Store CNA, RN, PT/OT/SLP, and support staff competencies with version history."
          />
          <Feature
            title="Assignments & reminders"
            body="Assign by role, track completion, and automate reminders before due dates."
          />
          <Feature
            title="Quizzes & skill checklists"
            body="Combine scored quizzes with in-person observations and electronic sign-off."
          />
          <Feature
            title="Survey-ready documentation"
            body="Instantly pull who is current, overdue, or exempt with timestamped records."
          />
          <Feature
            title="Multi-discipline support"
            body="Nursing, therapy, CNAs, support roles — tracked separately but visible from one admin view."
          />
          <Feature
            title="Scales with you"
            body="Start with one facility, then add more buildings and teams as you grow."
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-2xl border border-emerald-700/40 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-8 text-center shadow-lg shadow-emerald-500/20">
        <h2 className="text-2xl font-semibold text-emerald-200">
          Be the facility that&apos;s ready for survey day.
        </h2>
        <p className="mt-3 text-sm text-emerald-100/80">
          Start your first facility in CareCompetencyHub and see exactly who&apos;s
          current, overdue, or at risk — before your next audit.
        </p>
        <div className="mt-5 flex justify-center gap-3 text-sm">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
          >
            Start free admin account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-emerald-400/60 px-6 py-2.5 font-medium text-emerald-100 hover:bg-emerald-900/40"
          >
            Staff sign-in
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ?? "text-slate-50"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm shadow-black/30">
      <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-xs text-slate-300">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm shadow-sm shadow-black/30">
      <h3 className="font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-xs text-slate-300">{body}</p>
    </div>
  );
}
