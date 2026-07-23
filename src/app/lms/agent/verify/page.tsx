"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PUBLIC_API } from "../../../../lib/api";

export default function AgentVerifyPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-white/70 text-sm">Loading...</div>
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const params = useSearchParams();
  const router = useRouter();
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
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
        {status === "verifying" ? (
          <>
            <h1 className="text-xl font-bold text-white">Verifying Payment...</h1>
            <p className="mt-3 text-sm text-white/60">Please wait while we confirm the transaction.</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">&#10003;</div>
            <h1 className="text-xl font-bold text-white">Payment Successful!</h1>
            <p className="mt-3 text-sm text-white/60">{message}</p>
            <p className="mt-2 text-xs text-white/50">The student will receive their setup email shortly.</p>
            <button
              onClick={() => router.push("/lms/agent/dashboard")}
              className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:bg-white/90 transition"
            >
              Back to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-2xl text-rose-400">&#10007;</div>
            <h1 className="text-xl font-bold text-white">Payment Issue</h1>
            <p className="mt-3 text-sm text-white/60">{message}</p>
            <button
              onClick={() => router.push("/lms/agent/dashboard")}
              className="mt-6 inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
