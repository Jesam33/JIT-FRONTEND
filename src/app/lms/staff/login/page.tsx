"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "@/lib/api";
import { tenantHeaders, setTenantCookie, isSafeNextPath } from "@/lib/tenant-client";
import AuthLayout, { AuthField, AuthPasswordField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch(AUTH_API.staffLogin, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tenantHeaders() },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.message ?? "Login failed");
      setSubmitting(false);
      return;
    }

    localStorage.setItem("lms_staff_token", data.token);
    // Pin the institute the backend authenticated us into (see student login).
    setTenantCookie(data?.tenant?.slug);
    // Forward to an emailed deep link (?next=) when present + safe, else the dashboard.
    router.push(isSafeNextPath(nextParam) ? nextParam : "/lms/staff/app");
  }

  return (
    <AuthLayout title="Staff sign in" subtitle="Sign in to manage your classes and students.">
      {message ? <AuthMessage tone="error">{message}</AuthMessage> : null}
      <form className="space-y-4" onSubmit={login}>
        <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <AuthPasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
        <div className="flex justify-end">
          <Link href="/lms/staff/forgot-password" className="text-sm text-site-muted transition hover:text-site-text">Forgot password?</Link>
        </div>
        <AuthSubmitButton loading={submitting}>{submitting ? "Signing in…" : "Sign in"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginForm />
    </Suspense>
  );
}
