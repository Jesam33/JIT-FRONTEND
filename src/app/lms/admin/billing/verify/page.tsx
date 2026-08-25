"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";

type VerifyState = "verifying" | "active" | "pending" | "error";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<VerifyState>("verifying");
  const [plan, setPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const run = useCallback(async () => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) {
      setState("error");
      setMessage("No payment reference was provided.");
      return;
    }
    try {
      const res = await fetch(OWNER_API.billingVerify(reference), { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));

      if (res.status === 202) {
        // Payment not yet confirmed by Paystack — offer a retry.
        setState("pending");
        setMessage(json?.message || "Your payment is still being confirmed.");
        return;
      }
      if (!res.ok) {
        setState("error");
        setMessage(json?.message || `Verification failed (HTTP ${res.status}).`);
        return;
      }

      setState("active");
      setPlan(json?.plan ?? null);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }, [params, router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    run();
  }, [run, router]);

  return (
    <main className="site-shell">
      <section className="container-wide section-pad">
        <div className="mx-auto max-w-md">
          <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8 text-center">
            {state === "verifying" && (
              <>
                <h1 className="mb-2 text-2xl font-semibold text-white">Confirming your payment…</h1>
                <p className="text-sm text-site-muted">This only takes a moment.</p>
              </>
            )}

            {state === "active" && (
              <>
                <div className="mb-4 text-4xl">🎉</div>
                <h1 className="mb-2 text-2xl font-semibold text-white">
                  You&apos;re on the <span className="capitalize">{plan ?? "new"}</span> plan
                </h1>
                <p className="mb-6 text-sm text-site-muted">
                  Your upgrade is active. Thank you for supporting your institute.
                </p>
                <Link
                  href="/lms/admin"
                  className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
                >
                  Back to dashboard
                </Link>
              </>
            )}

            {state === "pending" && (
              <>
                <h1 className="mb-2 text-2xl font-semibold text-white">Almost there</h1>
                <p className="mb-6 text-sm text-site-muted">{message}</p>
                <button
                  onClick={() => {
                    setState("verifying");
                    run();
                  }}
                  className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
                >
                  Check again
                </button>
              </>
            )}

            {state === "error" && (
              <>
                <h1 className="mb-2 text-2xl font-semibold text-white">Something went wrong</h1>
                <p className="mb-6 text-sm text-red-200">{message}</p>
                <Link
                  href="/lms/admin/billing"
                  className="inline-block rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Back to billing
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function BillingVerifyPage() {
  return (
    <Suspense fallback={<main className="site-shell" />}>
      <VerifyInner />
    </Suspense>
  );
}
