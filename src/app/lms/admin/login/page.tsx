"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AUTH_API } from "@/lib/api";
import { getTenantSlug, setTenantCookie } from "@/lib/tenant-client";
import { setOwnerToken } from "@/lib/owner-client";
import InactivityNotice from "@/components/InactivityNotice";

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<main className="site-shell" />}>
      <OwnerLoginInner />
    </Suspense>
  );
}

function OwnerLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve the organisation slug from ?tenant= (apex fallback links) or the
  // tenant cookie/subdomain, so most owners never have to type it.
  useEffect(() => {
    const fromQuery = params.get("tenant");
    setOrgSlug(fromQuery || getTenantSlug() || "");
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(AUTH_API.ownerLogin, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          tenant_slug: orgSlug.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || `Sign in failed (HTTP ${res.status})`);
        return;
      }
      if (!json?.token) {
        setError("No session token returned. Please try again.");
        return;
      }
      setOwnerToken(json.token);
      // Pin the institute so the whole admin session (and any inactivity →
      // login redirect) stays on it, matching the student/staff portals.
      setTenantCookie(json?.tenant?.slug || orgSlug.trim());
      router.push("/lms/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="site-shell">
      <section className="container-wide section-pad">
        <div className="mx-auto max-w-md">
          <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
            <InactivityNotice />
            <h1 className="mb-1 text-2xl font-semibold text-white">Owner sign in</h1>
            <p className="mb-6 text-sm text-site-muted">Manage your institute&apos;s LMS.</p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/80">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 pr-12 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 flex items-center text-white/70"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Organisation</label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="your-institute"
                  className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white"
                />
                <p className="mt-2 text-xs text-white/50">
                  Detected from your institute&apos;s address. Change it only if you manage more than one.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-sm text-site-muted">
              Don&apos;t have an institute yet?{" "}
              <Link href="/signup" className="text-white underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
