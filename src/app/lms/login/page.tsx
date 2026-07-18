"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_API } from "@/lib/api";

export default function LmsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch(AUTH_API.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.message ?? "Login failed");
      setSubmitting(false);
      return;
    }

    localStorage.setItem("lms_student_token", data.token);
    router.push("/lms/app");
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-xl rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Student Portal Login</h1>
        <form className="mt-6 space-y-4" onSubmit={login}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white" required />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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

          <div className="flex justify-end">
            <Link href="/lms/forgot-password" className="text-xs text-white/75 underline">Forgot password?</Link>
          </div>

          <button type="submit" disabled={submitting} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60">
            {submitting ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Logging in...</span> : "Login"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
      </div>
    </section>
  );
}
