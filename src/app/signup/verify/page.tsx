"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";

type VerifyData = {
  status?: string;
  message?: string;
  front_door?: string;
  tenant?: { id: number; name: string; slug: string };
};

export default function SignupVerifyPage() {
  return (
    <Suspense
      fallback={
        <section className="section-pad section-divider">
          <div className="container-wide">
            <p className="text-site-muted">Loading…</p>
          </div>
        </section>
      }
    >
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const params = useSearchParams();
  const reference = params.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<VerifyData | null>(null);

  const verify = useCallback(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }
    setStatus("verifying");
    fetch(OWNER_API.signupVerify(reference))
      .then((res) => res.json())
      .then((d: VerifyData) => {
        setData(d);
        if (d.status === "success") {
          setStatus("success");
          setMessage(d.message ?? "Payment confirmed!");
        } else {
          setStatus("error");
          setMessage(d.message ?? "Your payment could not be confirmed yet.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not confirm payment. Please try again or contact support.");
      });
  }, [reference]);

  useEffect(() => {
    verify();
  }, [verify]);

  const ownerLoginHref = data?.tenant?.slug
    ? `/lms/admin/login?tenant=${encodeURIComponent(data.tenant.slug)}`
    : "/lms/admin/login";

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-xl">
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8 text-center">
          {status === "verifying" ? (
            <>
              <h1 className="text-2xl font-bold text-white">Confirming your payment…</h1>
              <p className="mt-4 text-site-muted">Please wait while we set up your institute.</p>
            </>
          ) : status === "success" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">
                ✓
              </div>
              <h1 className="text-2xl font-bold text-white">
                {data?.tenant?.name ? `${data.tenant.name} is ready!` : "Payment confirmed!"}
              </h1>
              <p className="mt-4 text-site-muted">{message}</p>
              <p className="mt-2 text-sm text-site-muted">
                We&apos;ve emailed your setup link. Open it to choose your password and sign in as the owner.
              </p>

              {data?.front_door && (
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left">
                  <div className="text-xs uppercase tracking-wide text-site-muted">Your institute address</div>
                  <div className="truncate text-sm text-white">{data.front_door}</div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={ownerLoginHref}
                  className="rounded-full bg-[#ed180d] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Owner sign in
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Back to home
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-3xl text-amber-300">
                ⏳
              </div>
              <h1 className="text-2xl font-bold text-white">Almost there</h1>
              <p className="mt-4 text-site-muted">{message}</p>
              <p className="mt-2 text-sm text-site-muted">
                If you were charged, confirmation can take a moment. Try again in a few seconds.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={verify}
                  className="rounded-full bg-[#ed180d] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Check again
                </button>
                <Link
                  href="/signup"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Back to signup
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
