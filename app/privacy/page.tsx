// app/privacy/page.tsx
export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8 text-foreground">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Legal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">1. Overview</h2>
          <p className="mt-2">
            CareCompetencyHub (“we”, “our”, “us”) is committed to protecting the
            privacy of our users. This Privacy Policy explains how we collect,
            use, and safeguard your information when you use our platform.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p className="mt-2">We may collect the following types of information:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-foreground">
                Account Information:
              </span>{" "}
              name, email, password, role, organization.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Facility Data:
              </span>{" "}
              staff lists, competencies, assignments, uploads, and related
              administrative information.
            </li>
            <li>
              <span className="font-semibold text-foreground">Usage Data:</span>{" "}
              activity logs, device/browser details, and general analytics.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Contact Form Data:
              </span>{" "}
              information you submit when requesting demos or sending inquiries.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <p className="mt-2">We use data to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Provide and maintain the Service</li>
            <li>Communicate with you about updates or support</li>
            <li>Improve product performance and user experience</li>
            <li>Help your facility track competencies &amp; progress</li>
            <li>Respond to demo and contact requests</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            4. Data Storage &amp; Security
          </h2>
          <p className="mt-2">
            We store data securely using industry-standard encryption and rely
            on trusted infrastructure providers such as Supabase and Vercel.
            We take appropriate measures to protect your information from
            unauthorized access, alteration, or misuse.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            5. Sharing of Information
          </h2>
          <p className="mt-2">
            We do not sell or rent your personal data. We may share information
            only with service providers that support the operation of the
            platform and only as necessary to provide the Service.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            6. Cookies &amp; Tracking
          </h2>
          <p className="mt-2">
            We may use cookies or analytics tools to understand usage patterns
            and improve the Service. You may disable cookies in your browser
            settings, though some features may not function properly.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            7. Children’s Privacy
          </h2>
          <p className="mt-2">
            CareCompetencyHub is not intended for individuals under 18 years of
            age. We do not knowingly collect information from minors.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            8. Changes to This Policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Updates will be
            posted on this page with a revised “Last updated” date.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            9. Contact Us
          </h2>
          <p className="mt-2">
            If you have questions or requests regarding your data, email us at{" "}
            <a
              href="mailto:info@carecompetencyhub.com"
              className="font-mono text-primary hover:opacity-90 underline underline-offset-4"
            >
              info@carecompetencyhub.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
