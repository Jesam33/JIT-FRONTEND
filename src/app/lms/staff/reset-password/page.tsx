"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "../../../../lib/api";
import { tenantHeaders, tenantLoginPath } from "../../../../lib/tenant-client";
import InstitutePublicShell from "../../../../components/institute/InstitutePublicShell";

export default function StaffResetPasswordPage() {
  return (
    <InstitutePublicShell>
      <Suspense fallback={<div className="section-pad section-divider"><div className="container-wide"><p className="text-white/70">Loading...</p></div></div>}>
        <PageContent />
      </Suspense>
    </InstitutePublicShell>
  );
}

function PageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const email = useMemo(() => params.get("email") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    const response = await fetch(AUTH_API.staffResetPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tenantHeaders() },
      body: JSON.stringify({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.message ?? "Could not reset password.");
      setSubmitting(false);
      return;
    }

    setMessage(data?.message ?? "Password reset successful.");
    setSubmitting(false);
    setTimeout(() => router.push(tenantLoginPath("staff")), 1200);
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-xl rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Staff Portal Reset Password</h1>
        <p className="mt-2 text-sm text-white/70">Email: {email || "Missing email"}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 pr-12 text-sm text-white"
              required
            />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/75" aria-label="Toggle password visibility">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <input
              type={showPasswordConfirmation ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 pr-12 text-sm text-white"
              required
            />
            <button type="button" onClick={() => setShowPasswordConfirmation((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/75" aria-label="Toggle confirm password visibility">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <button type="submit" disabled={submitting} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60">
            {submitting ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Resetting...</span> : "Reset Password"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-white/80">{message}</p> : null}
      </div>
    </section>
  );
}
