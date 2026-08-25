"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_API } from "../../../../lib/api";
import { tenantHeaders } from "../../../../lib/tenant-client";
import InactivityNotice from "../../../../components/InactivityNotice";
import InstitutePublicShell from "../../../../components/institute/InstitutePublicShell";

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("email") || "" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AGENT_API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tenantHeaders() },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Login failed."); return; }
      localStorage.setItem("lms_agent_token", data.token);
      router.push("/lms/agent/dashboard");
    } catch { setError("Network error."); }
    setLoading(false);
  }

  return (
    <InstitutePublicShell>
    <div className="site-shell min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <InactivityNotice />
        <h1 className="text-2xl font-bold text-center">Agent Login</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 pr-10 text-sm text-site-text outline-none focus:border-site-text/30" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-site-muted hover:text-site-text transition">
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="rounded-full bg-site-primary px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
              {loading ? "Logging in..." : "Login"}
            </button>
            <a href="/lms/agent/forgot-password" className="text-sm text-site-primary underline transition hover:brightness-110">Forgot Password?</a>
          </div>
        </form>
      </div>
    </div>
    </InstitutePublicShell>
  );
}
