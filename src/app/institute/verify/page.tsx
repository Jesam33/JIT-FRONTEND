"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PUBLIC_API } from "../../../lib/api";

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={<div className="section-pad section-divider"><div className="container-wide"><p className="text-white/70">Loading...</p></div></div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const params = useSearchParams();
  const reference = params.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

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
                We've sent your setup link to your email. Click it to set your password and access your portal.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold"
                style={{ background: 'var(--urbi-yellow, #e60000)', color: '#fff' }}
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
                href="/institute"
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
