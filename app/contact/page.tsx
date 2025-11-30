"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ContactFormState = {
  name: string;
  email: string;
  organization: string;
  role: string;
  staffSize: string;
  reason: "demo" | "question";
  message: string;
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
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong. Please try again, or email info@carecompetencyhub.com directly."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header (matches your layout / pricing header style) */}
      <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-slate-950">
              CCH
            </span>
            <span className="text-lg font-semibold tracking-tight">
              CareCompetencyHub
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-xs">
            <Link href="/blog" className="text-slate-300 hover:text-white">
              Blog
            </Link>
            <Link href="/podcast" className="text-slate-300 hover:text-white">
              Podcast
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row">
        {/* Left: intro / copy */}
        <section className="md:w-1/2 md:pr-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Contact
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Talk with a nurse-led competency team.
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Whether you&apos;re prepping for a survey, cleaning up a
            spreadsheet, or building clinical ladders for your team, we&apos;d
            love to show you how CareCompetencyHub can help.
          </p>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-200">
            <p className="font-semibold text-slate-50">
              How we usually use this call:
            </p>
            <ul className="mt-2 space-y-1">
              <li>• Review your current competency process</li>
              <li>• Walk through a live CareCompetencyHub demo</li>
              <li>• Map your roles / disciplines to our templates</li>
              <li>• Answer questions about pricing, rollout, and adoption</li>
            </ul>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Prefer email?
            <br />
            <span className="font-mono text-slate-200">
              info@carecompetencyhub.com
            </span>
          </div>
        </section>

        {/* Right: form */}
        <section className="md:w-1/2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            {submitted ? (
              <div className="space-y-3 text-sm text-slate-200">
                <h2 className="text-base font-semibold">
                  Thanks — we&apos;ve received your message. ✅
                </h2>
                <p className="text-xs text-slate-400">
                  We&apos;ll review your details and follow up at{" "}
                  <span className="font-semibold text-slate-100">
                    {form.email}
                  </span>{" "}
                  as soon as possible. If something&apos;s urgent, you can also
                  email{" "}
                  <span className="font-mono text-slate-100">
                    info@carecompetencyhub.com
                  </span>
                  .
                </p>
                <button
                  className="mt-2 inline-flex rounded-lg border border-slate-600 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800"
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
                <h2 className="text-sm font-semibold text-slate-50">
                  Tell us a little about your facility
                </h2>
                <p className="text-[11px] text-slate-400">
                  We&apos;ll use this to tailor your demo and follow-up.
                </p>

                {error && (
                  <p className="rounded-lg border border-red-500/60 bg-red-950/50 px-3 py-2 text-[11px] text-red-200">
                    {error}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      Your name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      Work email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      Facility / organization *
                    </label>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) =>
                        handleChange("organization", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      Your role / title
                    </label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => handleChange("role", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
                      placeholder="DON, Rehab Director, Administrator, etc."
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      Approx. staff to track
                    </label>
                    <select
                      value={form.staffSize}
                      onChange={(e) =>
                        handleChange("staffSize", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
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
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      I&apos;m most interested in:
                    </label>
                    <div className="flex gap-3 text-[11px] text-slate-200">
                      <button
                        type="button"
                        onClick={() => handleChange("reason", "demo")}
                        className={`flex-1 rounded-lg border px-3 py-2 ${
                          form.reason === "demo"
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-700 bg-slate-950 text-slate-200"
                        }`}
                      >
                        A product demo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange("reason", "question")}
                        className={`flex-1 rounded-lg border px-3 py-2 ${
                          form.reason === "question"
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-700 bg-slate-950 text-slate-200"
                        }`}
                      >
                        General questions
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">
                    How are you handling competencies today? *
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60"
                    placeholder="Tell us about your current process, pain points, or what you'd like to improve."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Submit request"}
                </button>
                <p className="text-[10px] text-slate-500">
                  By submitting this form you agree that we may contact you about
                  CareCompetencyHub. We don&apos;t share your information with
                  third parties.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
