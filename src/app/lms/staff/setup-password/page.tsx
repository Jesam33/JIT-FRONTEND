"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "@/lib/api";
import { tenantHeaders, tenantLoginPath } from "@/lib/tenant-client";
import AuthLayout, { AuthPasswordField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

function PageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const email = useMemo(() => params.get("email") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password !== passwordConfirmation) {
      setOk(false);
      setMessage("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    // The invite emails a reset-style token; the staff reset endpoint doubles as
    // account activation — it sets the password on the owner-issued account.
    const response = await fetch(AUTH_API.staffResetPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tenantHeaders() },
      body: JSON.stringify({ email, token, password, password_confirmation: passwordConfirmation }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setOk(false);
      setMessage(data?.message ?? "Could not activate your account.");
      setSubmitting(false);
      return;
    }
    setOk(true);
    setMessage("Account activated. Redirecting you to sign in…");
    setSubmitting(false);
    setTimeout(() => router.push(tenantLoginPath("staff")), 1200);
  }

  return (
    <AuthLayout
      title="Set up your staff account"
      subtitle={email ? `Welcome, ${email}! Choose a password to activate your account.` : "Choose a password to activate your account and sign in."}
      footer={<>Already activated? <Link href="/lms/staff/login" className="font-medium text-site-text underline">Sign in</Link></>}
    >
      {message ? <AuthMessage tone={ok ? "success" : "error"}>{message}</AuthMessage> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthPasswordField label="Create password" hint="At least 8 characters." value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" required minLength={8} />
        <AuthPasswordField label="Confirm password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Confirm your password" autoComplete="new-password" required minLength={8} />
        <AuthSubmitButton loading={submitting}>{submitting ? "Activating…" : "Activate account"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

export default function StaffSetupPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
