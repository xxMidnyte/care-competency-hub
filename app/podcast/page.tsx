// app/podcast/page.tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

const ui = {
  page: "mx-auto max-w-5xl px-6 py-10 space-y-10",
  kicker: "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "text-3xl font-semibold text-foreground sm:text-4xl tracking-tight",
  p: "text-sm text-muted-foreground leading-relaxed",
  cardInner: "p-6",
  subhead: "text-sm font-semibold text-foreground",
  mini: "text-[11px] text-muted-foreground",
  episodeCard:
    "p-4 transition hover:bg-muted/50 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2 focus-within:ring-offset-background",
  link: "text-primary hover:opacity-90 underline underline-offset-4",
  ctaWrap: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
};

export default function PodcastPage() {
  return (
    <div className={ui.page}>
      {/* Hero */}
      <section className="space-y-3">
        <p className={ui.kicker}>Podcast</p>
        <h1 className={ui.h1}>The CareCompetencyHub Podcast.</h1>
        <p className={`max-w-2xl ${ui.p}`}>
          Short, practical conversations about competencies, clinical ladders,
          survey prep, and how to build systems that support nurses, therapists,
          and CNAs—without burning everyone out.
        </p>
      </section>

      {/* Season card */}
      <Card className={ui.cardInner}>
        <p className="text-[11px] font-semibold text-primary">
          Season 1 · False Beliefs about Competencies
        </p>

        <h2 className="mt-2 text-base font-semibold text-foreground">
          Breaking the myths that keep your competency program stuck.
        </h2>

        <p className={`mt-2 ${ui.p}`}>
          Each episode tackles one “false belief” we hear from facilities all
          the time—from “the spreadsheet is fine” to “competencies are just a
          survey checkbox”—and walks through what to do instead.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card className={`bg-muted/30 ${ui.episodeCard}`}>
            <p className={ui.subhead}>
              Episode 1 · “The spreadsheet is good enough.”
            </p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Why spreadsheets quietly fall apart with turnover, new units, and
              multiple disciplines—and simple ways to start cleaning it up.
            </p>
            <p className={`mt-3 ${ui.mini}`}>
              Recording soon · Blog version coming to the{" "}
              <Link href="/blog" className={ui.link}>
                blog
              </Link>
              .
            </p>
          </Card>

          <Card className={`bg-muted/30 ${ui.episodeCard}`}>
            <p className={ui.subhead}>
              Episode 2 · “Competencies are just once a year.”
            </p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              How ongoing tracks, micro-checkoffs, and role-based ladders make
              surveys easier—and staff happier.
            </p>
            <p className={`mt-3 ${ui.mini}`}>
              Recording soon · Part of the False Beliefs series.
            </p>
          </Card>
        </div>

        {/* Tiny footer row (optional but makes it feel finished) */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-card px-3 py-1.5 font-semibold">
            New episodes: coming soon
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 font-semibold">
            Format: 10–20 min practical
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 font-semibold">
            Audience: DON / Educator / Rehab leads
          </span>
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-5">
        <div className={ui.ctaWrap}>
          <div>
            <p className="font-semibold text-foreground">
              Want to be a beta guest or get early access?
            </p>
            <p className={`mt-1 ${ui.p}`}>
              We&apos;re lining up early episodes with DONs, educators, and rehab
              leaders. Tell us a “false belief” you&apos;d like us to tackle.
            </p>
          </div>

          <ButtonLink
            href="/contact"
            variant="secondary"
            className="whitespace-nowrap"
          >
            Pitch an episode
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
