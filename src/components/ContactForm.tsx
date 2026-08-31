"use client";

import { useState, type FormEvent } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

// Contact form for the public /contact page. Posts to the same proven
// `/contact/send` endpoint the quote form uses, with the identical payload shape
// ({ name, email, phone, subject, content, agree_terms_and_policy }) so no new
// backend wiring is needed — only the copy is contact-flavoured.
export default function ContactForm() {
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

  const update =
    (field: "name" | "email" | "phone" | "subject" | "content") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
      setMessage(data?.message ?? "Message sent successfully! We'll be in touch soon.");
      setForm({ name: "", email: "", phone: "", subject: "", content: "", agree_terms_and_policy: false });
    } catch {
      setState("error");
      setMessage("Network error. Please try again later.");
    }
  };

  const inputClasses =
    "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/50 focus:bg-white/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-white/85">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
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
          <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-white/85">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
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
          <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-white/85">
            Phone / WhatsApp
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+234 800 000 0000"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-white/85">
            Subject
          </label>
          <input
            id="contact-subject"
            type="text"
            maxLength={500}
            value={form.subject}
            onChange={update("subject")}
            placeholder="How can we help?"
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-content" className="mb-2 block text-sm font-medium text-white/85">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-content"
          required
          maxLength={10000}
          rows={6}
          value={form.content}
          onChange={update("content")}
          placeholder="Tell us what you need..."
          className={`${inputClasses} resize-y`}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-white/75">
        <input
          type="checkbox"
          required
          checked={form.agree_terms_and_policy}
          onChange={(e) => setForm((prev) => ({ ...prev, agree_terms_and_policy: e.target.checked }))}
          className="mt-0.5 h-4 w-4 accent-site-primary"
        />
        <span>
          I agree to the{" "}
          <a href="/policies" className="text-white underline">
            Terms and Policy
          </a>{" "}
          <span className="text-red-500">*</span>
        </span>
      </label>

      {state === "success" && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </p>
      )}
      {state === "error" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-transparent bg-site-primary px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Sending..." : "Send Message"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
