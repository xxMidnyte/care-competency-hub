// app/pricing/page.tsx
import Link from "next/link";

type PlanCardProps = {
  name: string;
  price: string;
  subtext: string;
  badge?: string;
  features: string[];
  footnote?: string;
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
    <div className="relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
      {badge && (
        <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
          {badge}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-50">{name}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtext}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-50">{price}</span>
        <span className="text-xs text-slate-400">/ month</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        + per-staff pricing based on active users
      </p>

      <ul className="mt-4 space-y-2 text-xs text-slate-100">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-[2px] inline-flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[9px] text-emerald-300">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />
      <Link
        href="/contact"
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
      >
        Talk to us about this plan
      </Link>
      {footnote && (
        <p className="mt-2 text-[10px] text-slate-500 leading-snug">
          {footnote}
        </p>
      )}
    </div>
  );
}

type ComparisonRowProps = {
  label: string;
  cch: string;
  med: string;
};

function ComparisonRow({ label, cch, med }: ComparisonRowProps) {
  return (
    <tr className="border-b border-slate-800 text-xs">
      <td className="py-2 pr-4 align-top text-slate-300">{label}</td>
      <td className="py-2 px-2 align-top text-center text-[11px] text-emerald-200">
        {cch}
      </td>
      <td className="py-2 px-2 align-top text-center text-[11px] text-slate-200">
        {med}
      </td>
    </tr>
  );
}

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      {/* Hero */}
      <section className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Pricing
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
          Simple, transparent pricing for competencies that actually work.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
          CareCompetencyHub is built for nursing, rehab, and compliance leaders
          who are done with spreadsheets and binders. Start small, scale across
          facilities, and only pay for active staff.
        </p>
        <p className="mt-3 text-[11px] text-slate-400">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* Plans */}
      <section>
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

        <p className="mt-4 text-[11px] text-slate-400">
          Per-staff pricing: typically{" "}
          <span className="font-semibold text-slate-100">
            $3 per active staff
          </span>{" "}
          member per month, billed by active headcount. Inactive / archived
          staff are not charged.
        </p>

        <div className="mt-3 rounded-xl bg-slate-900 px-4 py-3 text-[11px] text-slate-100 sm:flex sm:items-center sm:justify-between">
          <p>
            Pay annually and save up to{" "}
            <span className="font-semibold text-emerald-300">20%</span> off base
            plan pricing.
          </p>
          <p className="mt-1 sm:mt-0">
            Ask about{" "}
            <span className="font-semibold text-amber-300">
              founders&apos; pricing
            </span>{" "}
            for early adopters.
          </p>
        </div>
      </section>

      {/* Add-ons */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-50">
          Add-ons & power modules
        </h2>
        <p className="max-w-3xl text-xs text-slate-300">
          Start with core competency tracking, then layer on modules as your
          facility grows. Most customers add at least one module within the
          first year.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-50">
              PolicyBuddy — $49 / month
            </h3>
            <p className="mt-1 text-slate-300">
              Centralize policies, track acknowledgments, and keep a searchable
              source of truth for staff and surveyors. Tie policies directly to
              competencies and roles.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-50">
              Tracks module — $49 / month
            </h3>
            <p className="mt-1 text-slate-300">
              Build custom tracks for charge nurse readiness, clinical ladders,
              specialized roles, and ownership buy-in paths. Show staff exactly
              what they need to do to level up.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-50">
              Advanced LMS pack — $2 / user / month
            </h3>
            <p className="mt-1 text-slate-300">
              Layer in curated clinical training modules, safety content, and
              regulatory refreshers. Track completions alongside competencies
              for a full picture of readiness.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-50">
              License & certification tracking — $0.50 / user / month
            </h3>
            <p className="mt-1 text-slate-300">
              Track license expirations, certifications, and renewals for nurses
              and therapists. Surface expiring items directly in dashboards so
              there are no surprises before surveys.
            </p>
          </div>
        </div>
      </section>

      {/* CCH vs MedTrainer */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              CareCompetencyHub vs MedTrainer
            </h2>
            <p className="max-w-3xl text-xs text-slate-300">
              MedTrainer is a broad LMS + compliance platform with a large
              course library. CareCompetencyHub is intentionally focused on
              clinical competencies, RN/PT skill tracking, and customizable
              progression paths tied directly to real-world practice.
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Based on public information from MedTrainer&apos;s website and
            reviews. Exact pricing/features may vary.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-[11px]">
                <th className="py-2 pr-4 text-slate-400">Capability</th>
                <th className="py-2 px-2 text-center text-slate-50">
                  CareCompetencyHub
                </th>
                <th className="py-2 px-2 text-center text-slate-50">
                  MedTrainer
                </th>
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
                cch="Tracks module: custom career ladders, promotion tracks, ownership/buy-in and leadership paths."
                med="Focus on courses, onboarding paths, and compliance workflows rather than granular skill ladders."
              />
              <ComparisonRow
                label="Rehab-specific focus (PT/OT/SLP)"
                cch="Designed with rehab disciplines alongside nursing, not as an afterthought."
                med="Supports multiple healthcare verticals; rehab is supported but not a core specialization."
              />
              <ComparisonRow
                label="Policy management"
                cch="PolicyBuddy add-on for policy upload, search, acknowledgments, and tie-in to competencies."
                med="Robust policy & document management with versioning and acknowledgement tracking."
              />
              <ComparisonRow
                label="Course library"
                cch="Lightweight LMS add-on focused on supporting competencies; bring your own content or targeted packs."
                med="Large proprietary healthcare course library with CE and certifications."
              />
              <ComparisonRow
                label="Dashboards"
                cch="Customizable widgets for overdue/due soon, discipline breakdown, tracks, and license status."
                med="Enterprise-grade dashboards for policies, courses, incidents, onboarding, and SDS."
              />
              <ComparisonRow
                label="AI features"
                cch="Roadmap: AI assistance for mapping regs to competencies and suggesting track content."
                med="AI Compliance Coach and AI Policy Guardian for answering compliance questions and reviewing policies."
              />
              <ComparisonRow
                label="Pricing transparency"
                cch="Clear published pricing with base + per-staff and optional add-ons. Accessible for clinics."
                med="Quote-driven pricing; often packaged by modules (learning, compliance, credentialing)."
              />
              <ComparisonRow
                label="Ideal customer"
                cch="Nurse consultants, DONs, rehab directors, clinic owners who want tight competency control and clear staff pathways."
                med="Larger organizations wanting a broad LMS + compliance stack across multiple workflows."
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        <div className="space-y-3 text-xs text-slate-300">
          <h2 className="text-sm font-semibold text-slate-50">
            Not sure which plan is right?
          </h2>
          <p>
            Most single facilities start on the Facility plan and grow into
            Tracks + PolicyBuddy over time. Rehab-only or single-discipline
            clinics usually start with the Starter Clinic plan.
          </p>
          <p>
            On a demo, we&apos;ll map your actual staff counts, roles, and
            current process to a recommended plan and send you a simple
            one-page summary.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-center text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Ready to see it live?
          </p>
          <h3 className="mt-2 text-sm font-semibold text-slate-50">
            Get a CareCompetencyHub demo for your facility.
          </h3>
          <p className="mt-2 text-slate-300">
            Bring your current spreadsheet, binder, or LMS export. We&apos;ll
            show you how it looks as a clean, filterable competency dashboard in
            under 30 minutes.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
            >
              Book a live demo
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-900"
            >
              Ask a pricing question
            </Link>
          </div>
          <p className="mt-3 text-[10px] text-slate-500">
            Early adopters may qualify for locked-in founders&apos; pricing and
            white-glove onboarding.
          </p>
        </div>
      </section>
    </main>
  );
}
