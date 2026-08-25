"use client";

import { useState, type FormEvent } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function QuoteRequestForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    content: "",
    agree_terms_and_policy: false,
  });
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/contact/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, agree_terms_and_policy: form.agree_terms_and_policy ? 1 : 0 }),
      });

      const data = await response.json();

      if (!response.ok || data?.error) {
        setState("error");
        setMessage(data?.message ?? "Something went wrong. Please try again later.");
        return;
      }

      setState("success");
      setMessage(data?.message ?? "Message sent successfully!");
      setForm({ name: "", email: "", phone: "", subject: "", content: "", agree_terms_and_policy: false });
    } catch {
      setState("error");
      setMessage("Network error. Please try again later.");
    }
  };

  const inputClasses =
    "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/50 focus:bg-white/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="quote-name" className="mb-2 block text-sm font-medium text-white/85">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-name"
            type="text"
            required
            maxLength={40}
            value={form.name}
            onChange={update("name")}
            placeholder="John Doe"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="quote-email" className="mb-2 block text-sm font-medium text-white/85">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-email"
            type="email"
            required
            maxLength={80}
            value={form.email}
            onChange={update("email")}
            placeholder="john@example.com"
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="quote-phone" className="mb-2 block text-sm font-medium text-white/85">
            Phone Number
          </label>
          <input
            id="quote-phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+234 800 000 0000"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="quote-subject" className="mb-2 block text-sm font-medium text-white/85">
            Project Type / Subject
          </label>
          <input
            id="quote-subject"
            type="text"
            maxLength={500}
            value={form.subject}
            onChange={update("subject")}
            placeholder="e.g. E-commerce Website"
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="quote-content" className="mb-2 block text-sm font-medium text-white/85">
          Project Details <span className="text-red-500">*</span>
        </label>
        <textarea
          id="quote-content"
          required
          maxLength={10000}
          rows={6}
          value={form.content}
          onChange={update("content")}
          placeholder="Tell us about your project — goals, features, timeline, budget..."
          className={`${inputClasses} resize-y`}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-white/75">
        <input
          type="checkbox"
          required
          checked={form.agree_terms_and_policy}
          onChange={e => setForm(prev => ({ ...prev, agree_terms_and_policy: e.target.checked }))}
          className="mt-0.5 h-4 w-4 accent-site-primary"
        />
        <span>
          I agree to the <span className="text-white underline">Terms and Policy</span> <span className="text-red-500">*</span>
        </span>
      </label>

      {state === "success" && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>
      )}
      {state === "error" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{message}</p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-transparent bg-site-primary px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Sending..." : "Request a Quote"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
