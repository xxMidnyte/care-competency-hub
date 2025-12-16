// app/terms/page.tsx
export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="mx-auto max-w-3xl px-6 py-4 text-foreground space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Legal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">1. Overview</h2>
          <p className="mt-2">
            These Terms of Service (“Terms”) govern your access to and use of
            CareCompetencyHub (the “Service”). By accessing or using the Service,
            you agree to be bound by these Terms. If you do not agree, do not use
            the Service.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            2. Who We Are
          </h2>
          <p className="mt-2">
            CareCompetencyHub (“we”, “our”, “us”) provides competency tracking,
            compliance workflows, and related tools for healthcare teams,
            including nursing and rehab disciplines.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            3. Accounts &amp; Access
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-foreground">
                Account responsibility:
              </span>{" "}
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activity under your account.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Accurate information:
              </span>{" "}
              You agree to provide accurate and current account information.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Org admin controls:
              </span>{" "}
              Organization admins may invite, remove, and manage users within
              their organization according to role permissions.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            4. Acceptable Use
          </h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Use the Service for unlawful, harmful, or fraudulent purposes.
            </li>
            <li>
              Attempt to gain unauthorized access to accounts, data, or systems.
            </li>
            <li>
              Upload malicious code, attempt to disrupt the Service, or abuse
              rate limits.
            </li>
            <li>
              Copy, reverse engineer, or resell the Service except as expressly
              permitted in writing by us.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            5. Data, Content, &amp; Ownership
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-foreground">
                Your content:
              </span>{" "}
              You retain ownership of the content you upload or create in the
              Service (e.g., staff records, competencies, policies, evidence
              uploads).
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Permission to operate:
              </span>{" "}
              You grant us the right to host, process, and display your content
              solely to provide and improve the Service.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Templates &amp; platform content:
              </span>{" "}
              The Service, including UI, code, and platform templates (unless
              explicitly marked as user-owned), is owned by CareCompetencyHub and
              protected by intellectual property laws.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            6. Privacy
          </h2>
          <p className="mt-2">
            Our{" "}
            <a
              href="/privacy"
              className="text-primary hover:opacity-90 underline underline-offset-4"
            >
              Privacy Policy
            </a>{" "}
            explains how we collect and use information. By using the Service,
            you agree to our privacy practices.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            7. Subscriptions, Billing, &amp; Trials
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-foreground">Trials:</span>{" "}
              Trials may be offered for a limited time and may be modified or
              discontinued.
            </li>
            <li>
              <span className="font-semibold text-foreground">Billing:</span>{" "}
              If you purchase a subscription, you agree to pay applicable fees
              and taxes. Subscription terms (monthly/annual) and included
              features depend on your plan.
            </li>
            <li>
              <span className="font-semibold text-foreground">Changes:</span>{" "}
              We may update pricing or plan features with reasonable notice where
              required.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            8. Availability &amp; Changes
          </h2>
          <p className="mt-2">
            We work hard to keep CareCompetencyHub available and reliable, but we
            do not guarantee uninterrupted access. We may modify, suspend, or
            discontinue parts of the Service (including features) as the product
            evolves.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            9. Disclaimers
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              The Service is provided on an “as is” and “as available” basis,
              without warranties of any kind, to the maximum extent permitted by
              law.
            </li>
            <li>
              CareCompetencyHub provides workflow and tracking tools and does not
              provide legal advice or guarantee regulatory outcomes. You are
              responsible for your facility’s compliance decisions and
              processes.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            10. Limitation of Liability
          </h2>
          <p className="mt-2">
            To the maximum extent permitted by law, CareCompetencyHub will not be
            liable for indirect, incidental, special, consequential, or punitive
            damages, or any loss of profits, data, or goodwill, arising from or
            related to your use of the Service.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            11. Termination
          </h2>
          <p className="mt-2">
            You may stop using the Service at any time. We may suspend or
            terminate access if you violate these Terms or if required to
            protect the Service, users, or data.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            12. Governing Law
          </h2>
          <p className="mt-2">
            These Terms are governed by the laws of the jurisdiction in which
            CareCompetencyHub operates, without regard to conflict of law
            principles.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            13. Contact Us
          </h2>
          <p className="mt-2">
            Questions about these Terms? Email{" "}
            <a
              href="mailto:info@carecompetencyhub.com"
              className="font-mono text-primary hover:opacity-90 underline underline-offset-4"
            >
              info@carecompetencyhub.com
            </a>
            .
          </p>
        </section>

        <p className="text-[11px] text-muted-foreground">
          Note: This document is a general template and may not cover all legal
          requirements for your specific business. Consider having counsel
          review before launch.
        </p>
      </div>
    </div>
  );
}
