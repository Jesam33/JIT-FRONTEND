"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_API } from "../../../../lib/api";

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AGENT_API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-site-bg text-site-text flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Agent Login</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
