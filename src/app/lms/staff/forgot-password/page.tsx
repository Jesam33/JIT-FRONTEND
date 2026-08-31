"use client";

import Link from "next/link";
import { useState } from "react";
import { AUTH_API } from "@/lib/api";
import { tenantHeaders } from "@/lib/tenant-client";
import AuthLayout, { AuthField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

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
      headers: { "Content-Type": "application/json", ...tenantHeaders() },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    setMessage(data?.message ?? "If the email exists, a reset link has been sent.");
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your staff email and we'll send you a reset link."
      footer={<>Remembered it? <Link href="/lms/staff/login" className="font-medium text-site-text underline">Back to sign in</Link></>}
    >
      {message ? <AuthMessage tone="success">{message}</AuthMessage> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <AuthSubmitButton loading={submitting}>{submitting ? "Sending…" : "Send reset link"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}
