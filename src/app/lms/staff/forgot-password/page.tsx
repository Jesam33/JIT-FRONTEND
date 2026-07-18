"use client";

import { useState } from "react";
import { AUTH_API } from "../../../../lib/api";

export default function StaffForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    const response = await fetch(AUTH_API.staffForgotPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    setSubmitting(false);
    setMessage(data?.message ?? "If the email exists, a reset link has been sent.");
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-xl rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Staff Portal Forgot Password</h1>
        <p className="mt-2 text-sm text-white/70">Enter your staff email to receive a password reset link.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white" required />
          <button type="submit" disabled={submitting} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60">
            {submitting ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Sending...</span> : "Send Reset Link"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-white/80">{message}</p> : null}
      </div>
    </section>
  );
}
