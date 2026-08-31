"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AUTH_API } from "@/lib/api";
import { getTenantSlug, setTenantCookie } from "@/lib/tenant-client";
import { setOwnerToken } from "@/lib/owner-client";
import AuthLayout, { AuthField, AuthPasswordField, AuthSubmitButton, AuthMessage } from "@/components/auth/AuthLayout";

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={null}>
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
    <AuthLayout
      title="Owner sign in"
      subtitle="Manage your Online Academy's LMS."
      footer={
        <>
          Don&apos;t have an Online Academy yet?{" "}
          <Link href="/signup" className="font-medium text-site-text underline">
            Create one
          </Link>
        </>
      }
    >
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      <form onSubmit={submit} className="space-y-4">
        <AuthField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <AuthPasswordField label="Password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
        <AuthField
          label="Organisation"
          type="text"
          value={orgSlug}
          onChange={(e) => setOrgSlug(e.target.value)}
          placeholder="your-academy"
          hint="Detected from your Online Academy's address. Change it only if you manage more than one."
        />
        <AuthSubmitButton loading={loading}>{loading ? "Signing in…" : "Sign in"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}
