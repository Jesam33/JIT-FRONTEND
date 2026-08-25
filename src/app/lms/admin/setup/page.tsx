"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AUTH_API } from "@/lib/api";
import { setOwnerToken } from "@/lib/owner-client";
import { resetBrandingToDefault, clearCachedBranding } from "@/lib/branding-cache";
import { getTenantSlug } from "@/lib/tenant-client";

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="site-shell" />}>
      <SetupInner />
    </Suspense>
  );
}

function SetupInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // This is a platform onboarding page for a brand-new institute, so it must
  // always render in the default Jorsas theme. A stale `tenant` cookie + cached
  // branding (e.g. from an institute that was later deleted) would otherwise
  // bleed its colors in through the global pre-paint script (app/layout.tsx).
  // Reset the live :root to default on mount and drop the stale cache so it
  // can't reappear on refresh. Safe: setup resolves the tenant from the invite
  // token server-side — the cookie/cache play no part in it. Once the owner
  // logs into their new institute, OwnerLayoutClient re-pins the correct cookie.
  useEffect(() => {
    resetBrandingToDefault();
    clearCachedBranding(getTenantSlug());
  }, []);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    fetch(AUTH_API.ownerInvite(token))
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json.email) setEmail(json.email);
        else setError("This invite link is invalid or has expired.");
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      mounted = false;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Missing setup token.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch(AUTH_API.ownerSetup, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, password, password_confirmation: confirm }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || `Setup failed (HTTP ${res.status})`);
        return;
      }
      if (!json?.token) {
        setError("No session token returned. Please try again.");
        return;
      }
      setOwnerToken(json.token);
      router.push("/lms/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white";

  return (
    <main className="site-shell">
      <section className="container-wide section-pad">
        <div className="mx-auto max-w-md">
          <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
            <h1 className="mb-1 text-2xl font-semibold text-white">Set up your owner account</h1>
            <p className="mb-6 text-sm text-site-muted">Choose a password to finish creating your institute.</p>

            {!token && <div className="text-sm text-site-muted">No setup token provided.</div>}
            {token && !email && !error && <div className="text-sm text-site-muted">Checking your invite…</div>}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {email && (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/80">Email</label>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                    {email}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`${inputCls} pr-12`}
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
                  <label className="mb-2 block text-sm text-white/80">Confirm password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className={inputCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {loading ? "Setting up…" : "Set up account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
