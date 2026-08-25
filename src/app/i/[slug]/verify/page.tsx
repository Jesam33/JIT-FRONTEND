"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PUBLIC_API } from "@/lib/api";

// Institute-scoped payment verification. Paystack redirects here (callback set
// by LmsIntakeController::initializePayment as /i/{slug}/verify) after a student
// pays on an institute's storefront. This route sits UNDER i/[slug]/layout.tsx,
// so it already wears the institute's own header/footer, brand colours and font
// — no JIT chrome. Every link stays inside /i/{slug} so navigating away keeps
// the visitor on the institute's mini-site. It polls the same tenant-agnostic
// verify endpoint the apex page uses (the tenant is resolved server-side from
// the globally-unique payment reference).
export default function InstituteVerifyPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="section-pad section-divider">
          <div className="container-wide">
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const reference = params.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  const home = `/i/${slug}`;

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    fetch(PUBLIC_API.paystackVerify(reference))
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setStatus("success");
          setMessage(data.message ?? "Payment confirmed!");
        } else {
          setStatus("error");
          setMessage(data.message ?? "Payment could not be verified.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not verify payment. Contact support.");
      });
  }, [reference]);

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-xl">
        <div className="rounded-xl border border-white/20 bg-white/5 p-8 text-center">
          {status === "verifying" ? (
            <>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Verifying Payment...
              </h1>
              <p className="mt-4 text-white/75">Please wait while we confirm your transaction.</p>
            </>
          ) : status === "success" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">
                ✓
              </div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Payment Successful!
              </h1>
              <p className="mt-4 text-white/75">{message}</p>
              <p className="mt-2 text-sm text-white/60">
                We&apos;ve sent your setup link to your email. Click it to set your password and access your portal.
              </p>
              <Link
                href={home}
                className="mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold text-white"
                style={{ background: "var(--color-primary, #e60000)" }}
              >
                Back to Home
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-3xl text-rose-300">
                ✕
              </div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Payment Issue
              </h1>
              <p className="mt-4 text-white/75">{message}</p>
              <Link
                href={home}
                className="mt-6 inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
              >
                Back to Courses
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
