"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AGENT_API, PUBLIC_API } from "../../../lib/api";

const qualifications = [
  "SSCE / WAEC / NECO",
  "GCE / O-Level",
  "ND / OND",
  "NCE",
  "HND",
  "Bachelor's Degree (B.Sc / B.A / B.Ed)",
  "Postgraduate Diploma (PGD)",
  "Master's Degree (M.Sc / M.A / M.Ed)",
  "Doctorate (PhD)",
  "Professional Certification",
  "Others",
];

type Course = { id: number; slug: string; title: string };

export default function AgentApplyPage() {
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    fetch(PUBLIC_API.instituteCourses)
      .then((r) => r.json())
      .then((data: Course[]) => setCourses(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setForm((f) => ({ ...f, courses_to_promote: selectedCourses.join(", ") }));
  }, [selectedCourses]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    home_address: "",
    qualification: "",
    target_students: "",
    experience: "",
    courses_to_promote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(AGENT_API.apply, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          home_address: form.home_address,
          qualification: form.qualification,
          custom_answers: {
            target_students: form.target_students,
            experience: form.experience,
            courses_to_promote: form.courses_to_promote,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to submit application.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("A network error occurred. Please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="relative min-h-screen site-shell flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-md w-full text-center space-y-6 relative z-10 border border-site-border bg-site-surface p-8 md:p-10 rounded-3xl shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Application Submitted!</h1>
            <p className="text-sm text-site-muted leading-relaxed">
              Thank you for applying to be a Jorsas Admission Marketer! Our partnership team is reviewing your profile. We will email you once your portal credentials and referral code are generated.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block w-full rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-500 transition shadow-[0_8px_20px_-4px_rgba(237,24,13,0.3)]"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen site-shell overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-red-600/5 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
        
        {/* Back navigation link */}
        <div className="mb-8">
          <Link href="/become-an-agent" className="inline-flex items-center gap-2 text-sm text-site-muted hover:text-site-text transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </Link>
        </div>

        {/* Split grid for layout */}
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          
          {/* Left Column - Information Summary */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-widest text-red-500">Admission-Marketer Onboarding</span>
              <h1 className="text-3xl font-extrabold sm:text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Start your Admission-Marketer application
              </h1>
              <p className="text-site-muted leading-relaxed">
                Connect your audience with high-quality tech training courses. Follow our 2-step application process to get verified.
              </p>
            </div>

            {/* Stepper Display */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-bold text-sm transition-all duration-300 ${
                  step >= 1 ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20" : "border-site-border bg-site-surface-soft text-site-muted"
                }`}>
                  1
                </div>
                <div>
                  <h4 className="font-bold text-site-text text-sm">Personal Information</h4>
                  <p className="text-xs text-site-muted">Contact details and general qualifications.</p>
                </div>
              </div>
              <div className="h-8 w-0.5 bg-site-border ml-5" />
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-bold text-sm transition-all duration-300 ${
                  step >= 2 ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20" : "border-site-border bg-site-surface-soft text-site-muted"
                }`}>
                  2
                </div>
                <div>
                  <h4 className="font-bold text-site-text text-sm">Promotional Strategy</h4>
                  <p className="text-xs text-site-muted">Target audience, experience, and targeted courses.</p>
                </div>
              </div>
            </div>

            {/* Micro card highlight */}
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5 space-y-2">
              <h5 className="font-bold text-red-500 text-sm">⚠️ Double Check Your Email</h5>
              <p className="text-xs text-site-muted leading-relaxed">
                We generate your Admission-Marketer account credentials and onboarding dashboard access details using the email address you submit here. Make sure it is active.
              </p>
            </div>
          </div>

          {/* Right Column - Form container */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-site-border bg-site-surface p-6 md:p-10 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {step === 1 ? (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-site-text" style={{ fontFamily: "var(--font-display)" }}>Personal Details</h3>
                    <p className="text-xs text-site-muted">Please provide your valid identity and contact details.</p>
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                        placeholder="First and last name"
                        className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text placeholder:text-site-muted/50 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Email Address *</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => update("email", e.target.value)}
                          required
                          placeholder="name@example.com"
                          className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text placeholder:text-site-muted/50 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Phone Number *</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => update("phone", e.target.value)}
                          required
                          placeholder="+234..."
                          className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text placeholder:text-site-muted/50 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Home/Office Address *</label>
                      <textarea
                        value={form.home_address}
                        onChange={(e) => update("home_address", e.target.value)}
                        required
                        rows={2}
                        placeholder="Your residential or work address"
                        className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text placeholder:text-site-muted/50 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Highest Educational Qualification *</label>
                      <select
                        value={form.qualification}
                        onChange={(e) => update("qualification", e.target.value)}
                        required
                        className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200"
                      >
                        <option value="">Select qualification</option>
                        {qualifications.map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-site-text" style={{ fontFamily: "var(--font-display)" }}>Promotional Details</h3>
                    <p className="text-xs text-site-muted">Tell us more about your target audience and promotion strategies.</p>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Where do you plan to find students? *</label>
                      <textarea
                        value={form.target_students}
                        onChange={(e) => update("target_students", e.target.value)}
                        required
                        rows={3}
                        placeholder="e.g. Social media networks, physical events, local high schools, online tech communities..."
                        className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text placeholder:text-site-muted/50 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">What is your experience in referral marketing? *</label>
                      <textarea
                        value={form.experience}
                        onChange={(e) => update("experience", e.target.value)}
                        required
                        rows={3}
                        placeholder="Briefly state your background in marketing, admission facilitation, or direct sales..."
                        className="w-full rounded-xl border border-site-border bg-site-surface-soft px-4 py-3.5 text-sm text-site-text placeholder:text-site-muted/50 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">Which courses will you focus on promoting? *</label>
                      <div className="grid gap-2 max-h-48 overflow-y-auto rounded-xl border border-site-border bg-site-surface-soft p-2">
                        {courses.length === 0 && (
                          <p className="text-xs text-site-muted px-2 py-1">Loading courses...</p>
                        )}
                        {courses.map((c) => (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition text-sm ${
                              selectedCourses.includes(c.title)
                                ? "bg-red-600/10 border border-red-500/30 text-site-text"
                                : "bg-transparent border border-transparent text-site-muted hover:text-site-text"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(c.title)}
                              onChange={() => {
                                setSelectedCourses((prev) =>
                                  prev.includes(c.title)
                                    ? prev.filter((t) => t !== c.title)
                                    : [...prev, c.title]
                                );
                              }}
                              className="h-4 w-4 rounded border-site-border accent-red-600"
                            />
                            {c.title}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error ? (
                  <p className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>
                ) : null}

                {/* Form Nav Buttons */}
                <div className="pt-2 flex gap-4">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-full border border-site-border bg-site-surface-soft px-6 py-3.5 text-sm font-bold text-site-text hover:bg-site-surface transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] rounded-full bg-red-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition shadow-[0_8px_20px_-4px_rgba(237,24,13,0.3)]"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Submitting...
                      </span>
                    ) : step === 1 ? (
                      "Continue"
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
