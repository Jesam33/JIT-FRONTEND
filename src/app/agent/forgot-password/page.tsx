"use client";

import { useState } from "react";
import { AGENT_API } from "../../../lib/api";

export default function AgentForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    const response = await fetch(AGENT_API.forgotPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    setSubmitting(false);
    setMessage(data?.message ?? "If the email exists, a reset link has been sent.");
  }

  return (
    <div className="site-shell min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        <p className="mt-2 text-center text-sm text-white/70">Enter your agent email to receive a reset link.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
            {submitting ? ( <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Sending...</span> ) : "Send Reset Link"}
          </button>
          {message ? <p className="text-sm text-white/80 text-center">{message}</p> : null}
          <p className="text-center text-sm text-white/50">
            <a href="/lms/agent/login" className="text-red-400 hover:text-red-300 underline">Back to login</a>
          </p>
        </form>
      </div>
    </div>
  );
}
