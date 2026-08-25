"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Tone = "checking" | "done" | "error" | "neutral";

function toneFor(status: string): Tone {
  const s = status.toLowerCase();
  if (!s) return "checking";
  if (s.includes("completed") || s.includes("done") || s.includes("success")) return "done";
  if (s.includes("fail") || s.includes("error")) return "error";
  return "neutral";
}

function OnboardingInner() {
  const params = useSearchParams();
  const tenant = params.get("tenant");
  const tenantName = params.get("tenant_name");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!tenant) return;
    let mounted = true;

    const poll = async () => {
      try {
        const res = await fetch(api(`/api/onboarding-status?tenant=${encodeURIComponent(tenant)}`));
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setStatus(json.status || JSON.stringify(json));
        } else {
          setStatus(`HTTP ${res.status}`);
        }
      } catch (e) {
        if (mounted) setStatus(e instanceof Error ? e.message : String(e));
      }
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tenant]);

  const tone = toneFor(status);

  return (
    <main className="site-shell">
      <section className="container-wide section-pad">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
            <h1 className="mb-1 text-2xl font-semibold text-white">Setting up your institute</h1>
            <p className="mb-6 text-sm text-site-muted">
              We&apos;re provisioning your LMS. This page updates automatically.
            </p>

            {!tenant && (
              <div className="text-sm text-site-muted">
                No institute reference provided.
              </div>
            )}

            {tenant && (
              <div className="space-y-4">
                <div className="text-sm text-site-muted">
                  Institute:{" "}
                  <span className="font-semibold text-white">
                    {tenantName ? decodeURIComponent(tenantName) : tenant}
                  </span>
                </div>

                {tone === "checking" && (
                  <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-site-muted">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Checking…
                  </div>
                )}

                {tone === "done" && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    <div className="font-semibold capitalize">{status}</div>
                    <p className="mt-2 text-emerald-100/80">
                      Your institute is ready. Check your email for the owner setup link, or sign in below.
                    </p>
                    <Link
                      href="/lms/admin/login"
                      className="mt-3 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
                    >
                      Owner sign in
                    </Link>
                  </div>
                )}

                {tone === "error" && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    <span className="capitalize">{status}</span>
                  </div>
                )}

                {tone === "neutral" && (
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    <span className="capitalize">{status}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function OnboardingStatus() {
  return (
    <Suspense fallback={<main className="site-shell" />}>
      <OnboardingInner />
    </Suspense>
  );
}
