"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "@/lib/api";

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="section-pad section-divider"><div className="container-wide"><p className="text-white/70">Loading...</p></div></div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSetup() {
    if (!password || password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    const response = await fetch(AUTH_API.setupPassword, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, password_confirmation: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.message ?? "Setup failed. The link may be expired.");
      setSubmitting(false);
      return;
    }

    if (data.token) {
      localStorage.setItem("lms_student_token", data.token);
    }

    router.push("/lms/app");
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-xl rounded-2xl border border-white/20 bg-white/[0.04] p-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Set Up Your Account
        </h1>
        <p className="mt-3 text-sm text-white/75">
          Welcome{email ? `, ${email}` : ""}! Create your password to access the student portal.
        </p>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password (min 8 characters)"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 pr-12 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/75"
              aria-label="Toggle password visibility"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSetup}
            disabled={submitting}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {submitting ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Setting up...</span> : "Enter Student Portal"}
          </button>
        </div>

        {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
      </div>
    </section>
  );
}
