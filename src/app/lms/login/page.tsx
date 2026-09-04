"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "@/lib/api";
import { tenantHeaders, setTenantCookie, isSafeNextPath, getTenantSlug, tenantStorefrontUrl } from "@/lib/tenant-client";
import AuthLayout, { AuthField, AuthPasswordField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const nextParam = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(expired ? "Session expired. Please log in again." : "");
  // When the backend says the email isn't registered, we surface a prominent
  // "browse courses to register" call-to-action rather than just an error line.
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotFound(false);
    const response = await fetch(AUTH_API.login, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tenantHeaders() },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data?.message ?? "Login failed");
      // reason: 'not_found' → no account for this email; show the register CTA.
      setNotFound(data?.reason === "not_found");
      setSubmitting(false);
      return;
    }
    localStorage.setItem("lms_student_token", data.token);
    // Pin the institute the backend authenticated us into, so the whole session
    // (branding fetch, portal API calls, and any inactivity → login redirect)
    // stays on this institute instead of falling back to the primary slug.
    setTenantCookie(data?.tenant?.slug);
    // Forward to the emailed deep link (?next=) when present + safe, else the
    // dashboard. isSafeNextPath blocks anything that isn't a same-origin LMS page.
    router.push(isSafeNextPath(nextParam) ? nextParam : "/lms/app");
  }

  // Where "browse the courses to register" points — this institute's public
  // storefront (its own /i/{slug} mini-site or subdomain), where a prospective
  // student can pick a course and self-register.
  const coursesHref = tenantStorefrontUrl(getTenantSlug());

  return (
    <AuthLayout title="Student sign in" subtitle="Welcome back. Sign in to continue learning.">
      {message ? (
        <AuthMessage tone={expired ? "warn" : "error"}>
          {message}
          {notFound ? (
            <>
              {" "}
              <a href={coursesHref} className="font-semibold underline underline-offset-4 hover:opacity-80">
                Browse courses to register
              </a>
              .
            </>
          ) : null}
        </AuthMessage>
      ) : null}
      <form className="space-y-4" onSubmit={login}>
        <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <AuthPasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
        <div className="flex justify-end">
          <Link href="/lms/forgot-password" className="text-sm text-site-muted underline underline-offset-4 transition hover:text-site-text">Forgot password?</Link>
        </div>
        <AuthSubmitButton loading={submitting}>{submitting ? "Signing in…" : "Sign in"}</AuthSubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-site-muted">
        New here?{" "}
        <a href={coursesHref} className="font-semibold text-site-text underline underline-offset-4 transition hover:opacity-80">
          Go to courses to register
        </a>
      </p>
    </AuthLayout>
  );
}

export default function LmsLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
