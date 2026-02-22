// app/page.tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const chip =
  "rounded-full border border-border bg-muted px-4 py-2 text-[12px] font-medium text-foreground";

const pill = "rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground";
  
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
              CareCompetencyHub gives you a future-proof, always-on competency program—
              powered by a{" "}
              <span className="font-medium text-foreground">
                prebuilt, role-based competency library
              </span>{" "}
              that you can assign in minutes. See exactly who’s covered, what’s due next,
              and what’s high-risk across nursing, PT/OT/SLP, and CNAs—so survey week feels
              like any other week.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button asChild variant="primary">
              <Link href="/signup">Explore the library (free)</Link>
            </Button>

            <Button asChild variant="secondary">
              <Link href="/login">Staff login</Link>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            No credit card required · No content creation required · Designed by a nurse consultant and therapist
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
              <p className="mt-1">DON / Educator view · CareCompetencyHub</p>
            </div>

            {/* Overall compliance */}
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
              <p className="text-[11px] font-semibold text-primary">
                Survey readiness (current + assigned)
              </p>
              <p className="mt-2 text-3xl font-semibold text-primary sm:text-4xl">
                93%
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                competency coverage across required roles
              </p>
            </div>

            {/* Three stats row */}
            <div className="mt-4 grid gap-3 text-[11px] md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-muted-foreground">Overdue staff</p>
                <p className="mt-2 text-lg font-semibold text-amber-500">7</p>
                <p className="mt-1 text-muted-foreground">auto-flagged for follow-up</p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-muted-foreground">Expiring soon</p>
                <p className="mt-2 text-lg font-semibold text-primary">18</p>
                <p className="mt-1 text-muted-foreground">
                  reminders already queued
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-muted-foreground">High-risk skills</p>
                <p className="mt-2 text-lg font-semibold text-sky-500">4</p>
                <p className="mt-1 text-muted-foreground">
                  evidence needed this week
                </p>
              </div>
            </div>

            {/* High-risk list */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-[11px]">
              <p className="font-semibold text-foreground">
                Common survey focus areas
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Hand hygiene — assign in one click</li>
                <li>• Abuse prevention — auto-reassign annually</li>
                <li>• Medication admin — track skills + evidence</li>
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
            Prebuilt competency library
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A ready-to-assign library by role and setting—so you start covered on day one.
            Customize later if you want. Most teams never need to.
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            No blank screens. No busywork.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-semibold text-primary">
            Proactive follow-up (before it’s a problem)
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            See overdue items, expiring skills, and high-risk gaps early—with reminders and
            escalation built in—so you fix issues on Tuesday, not during survey week.
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Catch gaps early. Stay calm.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-semibold text-primary">
            One source of truth
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Replace binders, spreadsheets, and scattered checklists with one real-time hub
            that shows coverage across your team, locations, and disciplines.
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Confidence, on demand.
          </p>
        </Card>
      </section>
    </div>
  );
}
