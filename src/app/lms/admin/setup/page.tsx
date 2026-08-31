"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AUTH_API } from "@/lib/api";
import { setOwnerToken } from "@/lib/owner-client";
import { resetBrandingToDefault, clearCachedBranding } from "@/lib/branding-cache";
import { getTenantSlug } from "@/lib/tenant-client";
import { AuthPasswordField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // This is a platform onboarding page for a brand-new institute, so it must
  // always render in the default Jorsas theme — hence it deliberately does NOT
  // use the <AuthLayout> wrapper (which fetches + applies public institute
  // branding). A stale `tenant` cookie + cached branding (e.g. from an institute
  // that was later deleted) would otherwise bleed its colors in through the
  // global pre-paint script (app/layout.tsx). Reset the live :root to default on
  // mount and drop the stale cache so it can't reappear on refresh. Safe: setup
  // resolves the tenant from the invite token server-side — the cookie/cache
  // play no part in it. Once the owner logs into their new institute,
  // OwnerLayoutClient re-pins the correct cookie. (We still reuse AuthLayout's
  // token-based field primitives so this screen matches the rest of the auth
  // family and is light/dark correct.)
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

  return (
    // Plain <div>, no opaque background and no `site-shell` of its own: the root
    // AppChrome already paints the ambient "pill" glow behind every page, so this
    // clean surface card simply sits over it — matching the login / forgot / reset
    // screens instead of a flat black canvas.
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Neutral education mark — this is platform onboarding, before the
            institute has any branding of its own to show. */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-site-surface text-site-muted ring-1 ring-site-border">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 10L12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-site-border bg-site-surface p-7 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-site-text">Set up your owner account</h1>
            <p className="mt-1.5 text-sm text-site-muted">Choose a password to finish creating your Online Academy.</p>
          </div>

          {!token && <p className="text-sm text-site-muted">No setup token provided.</p>}
          {token && !email && !error && <p className="text-sm text-site-muted">Checking your invite…</p>}
          {error && <AuthMessage tone="error">{error}</AuthMessage>}

          {email && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-site-text/80">Email</span>
                <div className="w-full rounded-xl border border-site-border bg-site-bg px-4 py-2.5 text-sm text-site-muted">
                  {email}
                </div>
              </div>

              <AuthPasswordField
                label="Password"
                hint="At least 8 characters."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                required
                minLength={8}
              />

              <AuthPasswordField
                label="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                minLength={8}
              />

              <AuthSubmitButton loading={loading}>{loading ? "Setting up…" : "Set up account"}</AuthSubmitButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
