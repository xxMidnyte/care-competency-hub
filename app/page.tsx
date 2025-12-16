// app/page.tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const chip =
  "rounded-full border border-border bg-muted px-4 py-2 text-[12px] font-medium text-foreground";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="grid gap-10 rounded-3xl border border-border bg-background p-6 md:grid-cols-[1.1fr,1fr] md:items-center sm:p-8">
        {/* Left: copy + CTAs */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Healthcare competencies · simplified
            </p>

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Keep every staff member{" "}
              <span className="text-primary">competent</span>
              <br className="hidden sm:block" />
              and <span className="text-primary">survey-ready!</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              CareCompetencyHub replaces scattered checklists and Excel trackers
              with one clean, real-time view of who is actually competent, who is
              in progress, and what&apos;s due next across nursing, PT/OT/SLP, and
              CNAs—so you&apos;re ready when surveyors walk in the door.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button asChild variant="primary">
              <Link href="/signup">Start a free admin account</Link>
            </Button>

            <Button asChild variant="secondary">
              <Link href="/login">Staff login</Link>
            </Button>

          </div>

          <p className="text-[11px] text-muted-foreground">
            No credit card required · Designed by a nurse consultant and therapist · Built
            for CNAs, nurses, and rehab teams
          </p>

          {/* Who it's for chips */}
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Built for:
            </span>
            <span className={chip}>Nursing homes &amp; assisted living</span>
            <span className={chip}>Therapy &amp; rehab clinics</span>
            <span className={chip}>Homecare &amp; community teams</span>
          </div>
        </div>

        {/* Right: facility snapshot card */}
        <div className="relative">
          {/* Glow */}
          <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-primary/10 blur-3xl" />

          <Card className="relative p-5 sm:p-6">
            <div className="text-[11px] text-muted-foreground">
              <p className="font-semibold text-foreground">Facility snapshot</p>
              <p className="mt-1">
                Director of Nursing view · CareCompetencyHub
              </p>
            </div>

            {/* Overall compliance */}
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
              <p className="text-[11px] font-semibold text-primary">
                Overall compliance
              </p>
              <p className="mt-2 text-3xl font-semibold text-primary sm:text-4xl">
                93%
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                of required competencies are current
              </p>
            </div>

            {/* Three stats row */}
            <div className="mt-4 grid gap-3 text-[11px] md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-muted-foreground">Overdue staff</p>
                <p className="mt-2 text-lg font-semibold text-amber-500">7</p>
                <p className="mt-1 text-muted-foreground">flagged for follow-up</p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-muted-foreground">Expiring in 30 days</p>
                <p className="mt-2 text-lg font-semibold text-primary">18</p>
                <p className="mt-1 text-muted-foreground">
                  automatic reminders scheduled
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-muted-foreground">High-risk skills</p>
                <p className="mt-2 text-lg font-semibold text-sky-500">4</p>
                <p className="mt-1 text-muted-foreground">
                  require evidence this week
                </p>
              </div>
            </div>

            {/* High-risk list */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-[11px]">
              <p className="font-semibold text-foreground">
                High-risk competencies
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Hand hygiene — 3 staff overdue</li>
                <li>• Abuse prevention — 2 staff overdue</li>
                <li>• Medication admin — expiring soon</li>
              </ul>
            </div>

            <p className="mt-4 text-[10px] text-muted-foreground">
              Example data for illustration. Your dashboard reflects your actual staff,
              competencies, evidence, and reminders.
            </p>
          </Card>
        </div>
      </section>

      {/* 3-column teaser */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-[11px] font-semibold text-primary">
            Built for nursing homes &amp; assisted living
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Stay on top of annual competencies for CNAs, nurses, and ancillary staff
            with clear dashboards and reminders.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-semibold text-primary">
            Therapy &amp; rehab clinics
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Track PT, OT, and SLP competencies, orientation, and ongoing skill checks
            across multiple locations.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-semibold text-primary">
            Homecare &amp; community teams
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Know which field staff are current on required training before the next
            visit or audit.
          </p>
        </Card>
      </section>
    </div>
  );
}
