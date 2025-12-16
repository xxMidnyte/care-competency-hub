// app/contact/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

type ContactFormState = {
  name: string;
  email: string;
  organization: string;
  role: string;
  staffSize: string;
  reason: "demo" | "question";
  message: string;
};

const ui = {
  page: "bg-background text-foreground",
  wrap: "mx-auto max-w-6xl px-6 py-10",
  grid: "grid gap-8 md:grid-cols-2",
  kicker: "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary",
  h1: "mt-2 text-2xl font-semibold tracking-tight sm:text-3xl",
  p: "mt-3 text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
  list: "mt-2 space-y-1 text-xs text-muted-foreground",
  cardPad: "p-6",
  formTitle: "text-sm font-semibold text-foreground",
  formHelp: "text-[11px] text-muted-foreground",
  err: "rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100",
  label: "mb-1 block text-[11px] font-medium text-muted-foreground",
  input:
    "w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  textarea:
    "h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  btnPrimary:
    "inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background",
  pill:
    "flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-semibold shadow-card transition hover:opacity-90",
  pillOn: "border-primary bg-primary/10 text-primary",
  pillOff: "text-foreground",
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    organization: "",
    role: "",
    staffSize: "",
    reason: "demo",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.organization || !form.message) {
      setError("Please fill in your name, email, organization, and message.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit.");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong. Please try again, or email info@carecompetencyhub.com directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={ui.page}>
      <div className={ui.wrap}>
        <div className={ui.grid}>
          {/* Left: intro */}
          <section>
            <p className={ui.kicker}>Contact</p>
            <h1 className={ui.h1}>Talk with a nurse-led competency team.</h1>
            <p className={ui.p}>
              Whether you&apos;re prepping for a survey, cleaning up a spreadsheet,
              or building clinical ladders for your team, we&apos;d love to show you
              how CareCompetencyHub can help.
            </p>

            <Card className="mt-5 p-5">
              <p className="font-semibold text-foreground">
                How we usually use this call:
              </p>
              <ul className={ui.list}>
                <li>• Review your current competency process</li>
                <li>• Walk through a live CareCompetencyHub demo</li>
                <li>• Map your roles / disciplines to our templates</li>
                <li>• Answer questions about pricing, rollout, and adoption</li>
              </ul>
            </Card>

            <div className="mt-5 space-y-2">
              <div className={ui.small}>
                Prefer email?
                <div className="mt-1 font-mono text-foreground">
                  info@carecompetencyhub.com
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/pricing" variant="secondary">
                  View pricing
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary">
                  Login
                </ButtonLink>
              </div>
            </div>
          </section>

          {/* Right: form */}
          <section>
            <Card className={ui.cardPad}>
              {submitted ? (
                <div className="space-y-3 text-sm">
                  <h2 className="text-base font-semibold text-foreground">
                    Thanks — we&apos;ve received your message. ✅
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll follow up at{" "}
                    <span className="font-semibold text-foreground">{form.email}</span>.
                    If something&apos;s urgent, email{" "}
                    <span className="font-mono text-foreground">
                      info@carecompetencyhub.com
                    </span>
                    .
                  </p>

                  <button
                    type="button"
                    className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-[11px] font-semibold text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: "",
                        email: "",
                        organization: "",
                        role: "",
                        staffSize: "",
                        reason: "demo",
                        message: "",
                      });
                    }}
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <h2 className={ui.formTitle}>
                      Tell us a little about your facility
                    </h2>
                    <p className={ui.formHelp}>
                      We&apos;ll use this to tailor your demo and follow-up.
                    </p>
                  </div>

                  {error && <p className={ui.err}>{error}</p>}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={ui.label} htmlFor="name">
                        Your name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={ui.input}
                        required
                      />
                    </div>
                    <div>
                      <label className={ui.label} htmlFor="email">
                        Work email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={ui.input}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={ui.label} htmlFor="org">
                        Facility / organization *
                      </label>
                      <input
                        id="org"
                        name="organization"
                        type="text"
                        autoComplete="organization"
                        value={form.organization}
                        onChange={(e) =>
                          handleChange("organization", e.target.value)
                        }
                        className={ui.input}
                        required
                      />
                    </div>
                    <div>
                      <label className={ui.label} htmlFor="role">
                        Your role / title
                      </label>
                      <input
                        id="role"
                        name="role"
                        type="text"
                        value={form.role}
                        onChange={(e) => handleChange("role", e.target.value)}
                        className={ui.input}
                        placeholder="DON, Rehab Director, Administrator, etc."
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={ui.label} htmlFor="staffSize">
                        Approx. staff to track
                      </label>
                      <select
                        id="staffSize"
                        name="staffSize"
                        value={form.staffSize}
                        onChange={(e) =>
                          handleChange("staffSize", e.target.value)
                        }
                        className={ui.input}
                      >
                        <option value="">Select an option</option>
                        <option value="1-15">1–15</option>
                        <option value="16-40">16–40</option>
                        <option value="41-75">41–75</option>
                        <option value="76-150">76–150</option>
                        <option value="150+">150+</option>
                      </select>
                    </div>

                    <div>
                      <label className={ui.label}>I&apos;m most interested in:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("reason", "demo")}
                          className={[
                            ui.pill,
                            form.reason === "demo" ? ui.pillOn : ui.pillOff,
                          ].join(" ")}
                        >
                          A product demo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("reason", "question")}
                          className={[
                            ui.pill,
                            form.reason === "question" ? ui.pillOn : ui.pillOff,
                          ].join(" ")}
                        >
                          General questions
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={ui.label} htmlFor="message">
                      How are you handling competencies today? *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      className={ui.textarea}
                      placeholder="Tell us about your current process, pain points, or what you'd like to improve."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={ui.btnPrimary}
                  >
                    {submitting ? "Sending…" : "Submit request"}
                  </button>

                  <p className="text-[10px] text-muted-foreground">
                    By submitting this form you agree that we may contact you about
                    CareCompetencyHub. We don&apos;t share your information with third
                    parties.
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    Back to{" "}
                    <Link href="/" className="text-primary hover:opacity-90">
                      home
                    </Link>
                    .
                  </p>
                </form>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
