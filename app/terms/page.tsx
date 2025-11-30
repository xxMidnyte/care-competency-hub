// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-slate-200">
      <h1 className="text-2xl font-semibold text-slate-50">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-base font-semibold text-slate-100">
            1. Overview
          </h2>
          <p className="mt-2">
            CareCompetencyHub (“we”, “our”, “us”) is committed to protecting the
            privacy of our users. This Privacy Policy explains how we collect,
            use, and safeguard your information when you use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            2. Information We Collect
          </h2>
          <p className="mt-2">We may collect the following types of information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            <li>
              **Account Information:** name, email, password, role,
              organization.
            </li>
            <li>
              **Facility Data:** staff lists, competencies, assignments,
              uploads, and related administrative information.
            </li>
            <li>
              **Usage Data:** activity logs, device/browser details, and
              general analytics.
            </li>
            <li>
              **Contact Form Data:** information you submit when requesting
              demos or sending inquiries.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            3. How We Use Your Information
          </h2>
          <p className="mt-2">We use data to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            <li>Provide and maintain the Service</li>
            <li>Communicate with you about updates or support</li>
            <li>Improve product performance and user experience</li>
            <li>Help your facility track competencies & progress</li>
            <li>Respond to demo and contact requests</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            4. Data Storage & Security
          </h2>
          <p className="mt-2">
            We store data securely using industry-standard encryption and rely
            on trusted infrastructure providers such as Supabase and Vercel.
            We take appropriate measures to protect your information from
            unauthorized access, alteration, or misuse.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            5. Sharing of Information
          </h2>
          <p className="mt-2">
            We do not sell or rent your personal data. We may share information
            only with service providers that support the operation of the
            platform (e.g., cloud hosting, email services), and only as
            necessary to provide the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            6. Cookies & Tracking
          </h2>
          <p className="mt-2">
            We may use cookies or analytics tools to understand usage patterns
            and improve the Service. You may disable cookies in your browser
            settings, though some features may not function properly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            7. Children’s Privacy
          </h2>
          <p className="mt-2">
            CareCompetencyHub is not intended for individuals under 18 years of
            age. We do not knowingly collect information from minors.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            8. Changes to This Policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Updates will be
            posted on this page with a revised “Last updated” date.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100">
            9. Contact Us
          </h2>
          <p className="mt-2">
            If you have questions or requests regarding your data, email us at{" "}
            <a
              href="mailto:info@carecompetencyhub.com"
              className="font-mono text-emerald-300"
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
