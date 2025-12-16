// app/pricing/page.tsx
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

type PlanCardProps = {
  name: string;
  price: string;
  subtext: string;
  badge?: string;
  features: string[];
  footnote?: string;
};

const ui = {
  page: "min-h-screen bg-background text-foreground",
  wrap: "mx-auto max-w-6xl px-6 py-10 space-y-12",
  kicker: "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "mt-2 text-2xl font-semibold tracking-tight sm:text-3xl",
  p: "mx-auto mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed",
  tiny: "mt-3 text-[11px] text-muted-foreground",
  sectionTitle: "text-sm font-semibold text-foreground",
  sectionSub: "max-w-3xl text-xs text-muted-foreground leading-relaxed",
  noteBar:
    "mt-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground sm:flex sm:items-center sm:justify-between",
  tableWrap:
    "overflow-x-auto rounded-2xl border border-border bg-card shadow-card",
  th: "py-2 px-3 text-[11px] font-semibold text-muted-foreground",
  td: "py-2 px-3 align-top text-xs text-muted-foreground",
  tdCenter: "py-2 px-3 align-top text-center text-[11px] text-muted-foreground",
  row: "border-b border-border last:border-0",
  badge:
    "absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-card",
  check:
    "mt-[2px] inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary",
  price: "text-3xl font-semibold tracking-tight",
};

function PlanCard({
  name,
  price,
  subtext,
  badge,
  features,
  footnote,
}: PlanCardProps) {
  return (
    <Card className="relative flex flex-col p-6">
      {badge && <div className={ui.badge}>{badge}</div>}

      <div>
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className={ui.price}>{price}</span>
        <span className="text-xs text-muted-foreground">/ month</span>
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground">
        + per-staff pricing based on active users
      </p>

      <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className={ui.check}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />

      <ButtonLink href="/contact" variant="primary" className="mt-4 w-full">
        Talk to us about this plan
      </ButtonLink>

      {footnote && (
        <p className="mt-3 text-[10px] text-muted-foreground leading-snug">
          {footnote}
        </p>
      )}
    </Card>
  );
}

type ComparisonRowProps = {
  label: string;
  cch: string;
  med: string;
};

function ComparisonRow({ label, cch, med }: ComparisonRowProps) {
  return (
    <tr className={ui.row}>
      <td className={`${ui.td} pr-6 text-muted-foreground`}>{label}</td>
      <td className={`${ui.tdCenter} text-primary`}>{cch}</td>
      <td className={ui.tdCenter}>{med}</td>
    </tr>
  );
}

export default function PricingPage() {
  return (
    <main className={ui.page}>
      <div className={ui.wrap}>
        {/* Hero */}
        <section className="text-center">
          <p className={ui.kicker}>Pricing</p>
          <h1 className={ui.h1}>
            Simple, transparent pricing for competencies that actually work.
          </h1>
          <p className={ui.p}>
            CareCompetencyHub is built for nursing, rehab, and compliance leaders
            who are done with spreadsheets and binders. Start small, scale across
            facilities, and only pay for active staff.
          </p>
          <p className={ui.tiny}>
            All plans include a 14-day free trial. No credit card required.
          </p>
        </section>

        {/* Plans */}
        <section className="space-y-4">
          <div className="grid gap-5 md:grid-cols-3">
            <PlanCard
              name="Starter Clinic"
              price="$99"
              subtext="For outpatient clinics, therapy practices, and small teams."
              features={[
                "Up to ~25 tracked staff (per-staff pricing after that)",
                "Unlimited competencies & staff profiles",
                "RN & PT/OT/SLP template library",
                "Competency assignments & due dates",
                "Evidence uploads for checkoffs & certificates",
                "Automated email reminders",
                "Basic dashboard & reports",
                "Email support",
              ]}
              footnote="Perfect for PT clinics, small nursing teams, and independent rehab programs."
            />

            <PlanCard
              name="Facility"
              price="$149"
              subtext="For SNFs, LTCs, hospital units, and multi-discipline clinics."
              badge="Most popular"
              features={[
                "Everything in Starter Clinic",
                "Multi-disciplinary support (RN, LPN, CNA, PT, OT, SLP, more)",
                "Custom competency templates per facility",
                "Tracks module — career ladders & progression paths",
                "Advanced dashboard widgets & filters",
                "PDF audit bundles & survey export pack",
                "Unlimited admin users",
                "Priority support response",
              ]}
              footnote="Most nursing homes, LTC facilities, and rehab departments will fit here."
            />

            <PlanCard
              name="Enterprise"
              price="$199"
              subtext="For multi-facility operators, regional groups, and hospital systems."
              features={[
                "Everything in Facility",
                "Multi-facility manager dashboard",
                "Org-wide competency standards & overrides",
                "API access for HRIS/SSO integration",
                "White-label options",
                "Dedicated onboarding & success contact",
              ]}
              footnote="Best for operations groups and systems managing multiple facilities."
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Per-staff pricing: typically{" "}
            <span className="font-semibold text-foreground">
              $3 per active staff
            </span>{" "}
            member per month, billed by active headcount. Inactive / archived
            staff are not charged.
          </p>

          <div className={ui.noteBar}>
            <p>
              Pay annually and save up to{" "}
              <span className="font-semibold text-primary">20%</span> off base
              plan pricing.
            </p>
            <p className="mt-1 sm:mt-0">
              Ask about{" "}
              <span className="font-semibold text-foreground">
                founders&apos; pricing
              </span>{" "}
              for early adopters.
            </p>
          </div>
        </section>

        {/* Add-ons */}
        <section className="space-y-4">
          <h2 className={ui.sectionTitle}>Add-ons & power modules</h2>
          <p className={ui.sectionSub}>
            Start with core competency tracking, then layer on modules as your
            facility grows. Most customers add at least one module within the
            first year.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                PolicyBuddy — $49 / month
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Centralize policies, track acknowledgments, and keep a searchable
                source of truth for staff and surveyors. Tie policies directly
                to competencies and roles.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Tracks module — $49 / month
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Build custom tracks for charge nurse readiness, clinical ladders,
                specialized roles, and ownership buy-in paths. Show staff exactly
                what they need to do to level up.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Advanced LMS pack — $2 / user / month
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Layer in curated clinical training modules, safety content, and
                regulatory refreshers. Track completions alongside competencies
                for a full picture of readiness.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                License & certification tracking — $0.50 / user / month
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Track license expirations, certifications, and renewals for
                nurses and therapists. Surface expiring items directly in
                dashboards so there are no surprises before surveys.
              </p>
            </Card>
          </div>
        </section>

        {/* CCH vs MedTrainer */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={ui.sectionTitle}>CareCompetencyHub vs MedTrainer</h2>
              <p className={ui.sectionSub}>
                MedTrainer is a broad LMS + compliance platform with a large
                course library. CareCompetencyHub is intentionally focused on
                clinical competencies, RN/PT skill tracking, and customizable
                progression paths tied directly to real-world practice.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Based on public info + reviews. Exact pricing/features may vary.
            </p>
          </div>

          <div className={ui.tableWrap}>
            <table className="min-w-full border-collapse text-left">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className={`${ui.th} pl-4`}>Capability</th>
                  <th className={`${ui.th} text-center`}>CareCompetencyHub</th>
                  <th className={`${ui.th} pr-4 text-center`}>MedTrainer</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Primary focus"
                  cch="Competency tracking for nursing & rehab (RN, PT, OT, SLP, CNA) with skill paths & readiness."
                  med="All-in-one compliance + LMS + credentialing, with a large course library and broad training focus."
                />
                <ComparisonRow
                  label="Competency matrix"
                  cch="Built-in competency matrix with template libraries plus full customization per facility."
                  med="Training completion & compliance dashboards; competency emphasis varies by configuration."
                />
                <ComparisonRow
                  label="Clinical tracks / ladders"
                  cch="Tracks module: custom career ladders, promotion tracks, leadership paths."
                  med="Focus on courses, onboarding paths, and compliance workflows vs granular skill ladders."
                />
                <ComparisonRow
                  label="Rehab-specific focus (PT/OT/SLP)"
                  cch="Designed with rehab disciplines alongside nursing, not as an afterthought."
                  med="Supports multiple healthcare verticals; rehab supported but not a core specialization."
                />
                <ComparisonRow
                  label="Policy management"
                  cch="PolicyBuddy add-on for upload, search, acknowledgments, and tie-in to competencies."
                  med="Robust policy & document management with versioning and acknowledgement tracking."
                />
                <ComparisonRow
                  label="Course library"
                  cch="Lightweight LMS add-on focused on supporting competencies; bring your own content or targeted packs."
                  med="Large proprietary healthcare course library with CE and certifications."
                />
                <ComparisonRow
                  label="Dashboards"
                  cch="Widgets for overdue/due soon, discipline breakdown, tracks, license status."
                  med="Enterprise dashboards for policies, courses, incidents, onboarding, SDS."
                />
                <ComparisonRow
                  label="AI features"
                  cch="Roadmap: AI assistance for mapping regs to competencies and suggesting track content."
                  med="AI tools for compliance Q&A and policy review."
                />
                <ComparisonRow
                  label="Pricing transparency"
                  cch="Published pricing with base + per-staff and optional add-ons."
                  med="Quote-driven pricing; packaged by modules."
                />
                <ComparisonRow
                  label="Ideal customer"
                  cch="DONs, educators, rehab directors, clinic owners who want tight competency control."
                  med="Larger orgs wanting a broad LMS + compliance stack."
                />
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
          <div className="space-y-3 text-xs text-muted-foreground">
            <h2 className="text-sm font-semibold text-foreground">
              Not sure which plan is right?
            </h2>
            <p>
              Most single facilities start on the Facility plan and grow into
              Tracks + PolicyBuddy over time. Rehab-only or single-discipline
              clinics usually start with Starter Clinic.
            </p>
            <p>
              On a demo, we&apos;ll map your staff counts, roles, and current
              process to a recommended plan and send you a simple one-page
              summary.
            </p>
          </div>

          <Card className="p-6 text-center">
            <p className={ui.kicker}>Ready to see it live?</p>
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              Get a CareCompetencyHub demo for your facility.
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Bring your current spreadsheet, binder, or LMS export. We&apos;ll
              show you how it looks as a clean, filterable competency dashboard
              in under 30 minutes.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <ButtonLink href="/demo" variant="primary" className="w-full">
                Book a live demo
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" className="w-full">
                Ask a pricing question
              </ButtonLink>
            </div>

            <p className="mt-4 text-[10px] text-muted-foreground">
              Early adopters may qualify for locked-in founders&apos; pricing and
              white-glove onboarding.
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
