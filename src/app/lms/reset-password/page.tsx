"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
    setSubmitting(true);
    const response = await fetch(AUTH_API.resetPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tenantHeaders() },
      body: JSON.stringify({ email, token, password, password_confirmation: passwordConfirmation }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setOk(false);
      setMessage(data?.message ?? "Could not reset password.");
      setSubmitting(false);
      return;
    }
    setOk(true);
    setMessage(data?.message ?? "Password reset successful. Redirecting…");
    setSubmitting(false);
    setTimeout(() => router.push(tenantLoginPath("student")), 1200);
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={email ? `For ${email}` : "Choose a new password for your account."}
      footer={<>Back to <Link href="/lms/login" className="font-medium text-site-text underline">sign in</Link></>}
    >
      {message ? <AuthMessage tone={ok ? "success" : "error"}>{message}</AuthMessage> : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthPasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" autoComplete="new-password" required />
        <AuthPasswordField label="Confirm new password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" required />
        <AuthSubmitButton loading={submitting}>{submitting ? "Resetting…" : "Reset password"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

export default function StudentResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
