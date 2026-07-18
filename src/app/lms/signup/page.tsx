"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API } from "@/lib/api";

export default function LmsSignupPage() {
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

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [mode, setMode] = useState<"live" | "pre_recorded">("live");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(AUTH_API.invite(token))
      .then((res) => res.json())
      .then((data) => {
        if (data?.email) {
          setEmail(data.email);
          setFirstName(data.first_name ?? "");
          setCourseName(data.course_name ?? "");
          if (data.learning_mode === "pre_recorded") {
            setMode("pre_recorded");
          }
        }
      });
  }, [token]);

  async function completeSignup() {
    setSubmitting(true);
    const response = await fetch(AUTH_API.signup, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.message ?? "Failed to complete signup.");
      setSubmitting(false);
      return;
    }

    if (data?.token) {
      localStorage.setItem("lms_student_token", data.token);
    }

    router.push("/lms/app");
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-3xl rounded-[22px] border border-white/20 bg-white/[0.04] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-white/65">Student Portal Onboarding</p>
        <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Welcome to Jorsas Student Portal
        </h1>
        <p className="mt-3 text-sm text-white/75">Email: {email || "Loading..."}</p>

        <div className="mt-6 flex gap-2 text-xs">
          <span className="rounded-full bg-white px-3 py-1 text-black">Account Setup</span>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-white/20 bg-black/20 p-4 text-sm text-white/85">
            <p>
              Course from your registration: <span className="font-semibold text-white">{courseName || "Not provided"}</span>
            </p>
            <p className="mt-1">
              Learning mode: <span className="font-semibold text-white">{mode === "live" ? "Live Classes" : "Pre-recorded"}</span>
            </p>
          </div>
          <p className="text-sm text-white/80">
            Hi {firstName || "Student"}, your course selection is already saved. Create your password to continue.
          </p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 pr-12 text-sm text-white"
            />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/75" aria-label="Toggle password visibility">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={completeSignup} disabled={submitting} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {submitting ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Setting up...</span> : "Finish and Enter Student Portal"}
            </button>
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
      </div>
    </section>
  );
}
