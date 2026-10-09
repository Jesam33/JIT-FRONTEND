"use client";

// Monthly-course billing for the student: where they stand, pay for the next
// month, and stop or restart renewing. Also the landing page when access has
// paused for non-payment (StudentGuard + apiFetch redirect here on the 402), and
// the Paystack callback for a renewal (?reference=… is verified on arrival).
// Backend: StudentBillingController + App\Services\CourseBilling.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { STUDENT_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";
import { formatPrice } from "@/lib/currency";
import LoadingSpinner from "@/components/LoadingSpinner";

type Billing = {
  monthly: boolean;
  locked: boolean;
  course_name?: string;
  amount?: number;
  currency?: string;
  status?: "active" | "past_due" | "cancelled" | "ended" | null;
  // Why billing stopped, when status is "ended".
  end_reason?: string | null;
  paid_until?: string | null;
  access_ends_at?: string | null;
  grace_days?: number;
  due?: boolean;
  can_pay?: boolean;
  can_cancel?: boolean;
  can_resume?: boolean;
  card?: { last4: string | null; brand: string | null } | null;
};

type PaymentRow = {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  kind: "initial" | "renewal";
  period_end: string | null;
  paid_at: string | null;
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "?";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "?" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// useSearchParams needs a Suspense boundary for the static build.
export default function StudentBillingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StudentBilling />
    </Suspense>
  );
}

function StudentBilling() {
  const params = useSearchParams();
  const reference = params?.get("reference") ?? "";

  const [billing, setBilling] = useState<Billing | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<"" | "pay" | "cancel" | "resume" | "verify">(reference ? "verify" : "");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const verifiedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(STUDENT_API.courseBilling);
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      setLoadError(false);
      setBilling(j.billing ?? { monthly: false, locked: false });
      setPayments(Array.isArray(j.payments) ? j.payments : []);
    } catch {
      setLoadError(true);
      setBilling((b) => b ?? { monthly: false, locked: false });
    }
  }, []);

  // Back from Paystack: confirm the renewal once, then show the fresh state.
  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    (async () => {
      if (!reference) {
        await load();
        return;
      }
      try {
        const r = await apiFetch(`${STUDENT_API.courseBillingVerify}?reference=${encodeURIComponent(reference)}`);
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.status === "success") {
          setJustPaid(true);
          setNotice({ kind: "ok", text: "Payment confirmed. Thank you!" });
        } else if (j.status === "review") {
          setNotice({ kind: "ok", text: j.message ?? "Payment received. Your academy will confirm it shortly." });
        } else {
          setNotice({ kind: "err", text: j.message ?? "We could not confirm that payment yet. Refresh in a moment." });
        }
      } catch {
        setNotice({ kind: "err", text: "We could not confirm that payment yet. Refresh in a moment." });
      } finally {
        setBusy("");
        // Drop ?reference so a refresh doesn't re-verify.
        window.history.replaceState(null, "", window.location.pathname);
        await load();
      }
    })();
  }, [reference, load]);

  const pay = async () => {
    setBusy("pay");
    setNotice(null);
    try {
      const r = await apiFetch(STUDENT_API.courseBillingRenew, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.authorization_url) {
        window.location.href = j.authorization_url;
        return;
      }
      setNotice({ kind: "err", text: j.message ?? "Could not start the payment. Please try again." });
    } catch {
      setNotice({ kind: "err", text: "Could not start the payment. Please try again." });
    }
    setBusy("");
  };

  const toggleRenewal = async (action: "cancel" | "resume") => {
    if (action === "cancel" && !window.confirm("Stop your monthly payments? You keep access until the end of the month you've paid for.")) {
      return;
    }
    setBusy(action);
    setNotice(null);
    try {
      const r = await apiFetch(action === "cancel" ? STUDENT_API.courseBillingCancel : STUDENT_API.courseBillingResume, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      setNotice({ kind: r.ok ? "ok" : "err", text: j.message ?? (r.ok ? "Done." : "Something went wrong. Please try again.") });
      if (r.ok && j.billing) setBilling(j.billing);
    } catch {
      setNotice({ kind: "err", text: "Something went wrong. Please try again." });
    }
    setBusy("");
  };

  if (!billing || busy === "verify") return <LoadingSpinner />;

  const amount = billing.amount ? formatPrice(billing.amount, billing.currency ?? "NGN") : "";

  // Not on a monthly course: nothing to manage here.
  if (!billing.monthly) {
    return (
      <div className="space-y-6 pb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Billing</h1>
        {loadError ? (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Couldn&apos;t load your billing. Refresh the page to try again.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center text-sm text-white/70">
            Your course was paid for in full. There are no monthly payments.
          </div>
        )}
      </div>
    );
  }

  const statusLine = (() => {
    switch (billing.status) {
      case "ended":
        switch (billing.end_reason) {
          case "stopped_by_academy":
            return "Your academy has stopped monthly billing for this course. You won't be charged again.";
          case "course_deleted":
            return "This course is no longer offered, so there are no more payments.";
          case "academy_closed":
            return "Your academy has closed, so there are no more payments.";
          default:
            return "Your course has finished, so there are no more payments.";
        }
      case "cancelled":
        return billing.locked
          ? "You stopped your monthly payments and the month you paid for has ended."
          : `You stopped your monthly payments. You keep access until ${fmtDate(billing.paid_until)}.`;
      case "past_due":
        return billing.locked
          ? "Your monthly payment is overdue, so your access is paused."
          : `Your payment was due on ${fmtDate(billing.paid_until)}. Pay before ${fmtDate(billing.access_ends_at)} to keep your access.`;
      default:
        return billing.card
          ? `Paid until ${fmtDate(billing.paid_until)}. We'll charge your card ending ${billing.card.last4 ?? ""} on that day.`
          : `Paid until ${fmtDate(billing.paid_until)}. Pay for next month any time before then.`;
    }
  })();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Billing</h1>
        <p className="mt-1 text-sm text-white/60">
          {billing.course_name} is billed monthly at {amount}.
        </p>
      </div>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"
          }`}
        >
          {notice.text}
          {justPaid && !billing.locked ? (
            <>
              {" "}
              {/* Full load, not a client push: the portal shell remembers the
                  paused state until it remounts. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate full reload, see above */}
              <a href="/lms/app" className="font-semibold underline underline-offset-2">Continue to your course</a>
            </>
          ) : null}
        </div>
      ) : null}

      <div
        className={`rounded-2xl border p-6 ${
          billing.locked ? "border-rose-400/40 bg-rose-500/10" : "border-white/15 bg-black/30"
        }`}
      >
        {billing.locked ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-rose-200">Access paused</p>
        ) : null}
        <p className="text-base text-white">{statusLine}</p>
        {billing.locked ? (
          <p className="mt-2 text-sm text-white/70">
            Your work, progress and messages are all saved. Pay for this month and everything comes back straight away.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {billing.can_pay ? (
            <button
              onClick={pay}
              disabled={busy !== ""}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {busy === "pay" ? "Opening payment…" : `Pay ${amount} for ${billing.locked || billing.due ? "this" : "next"} month`}
            </button>
          ) : null}
          {billing.can_cancel ? (
            <button
              onClick={() => toggleRenewal("cancel")}
              disabled={busy !== ""}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
            >
              {busy === "cancel" ? "Stopping…" : "Stop monthly payments"}
            </button>
          ) : null}
          {billing.can_resume ? (
            <button
              onClick={() => toggleRenewal("resume")}
              disabled={busy !== ""}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
            >
              {busy === "resume" ? "Turning on…" : "Keep my monthly payments"}
            </button>
          ) : null}
        </div>

        {billing.status !== "ended" ? (
          <p className="mt-4 text-xs text-white/50">
            Paying by card lets us renew automatically each month. If a payment is missed, your access pauses{" "}
            {billing.grace_days ?? 2} days after the due date and comes back as soon as you pay. We&apos;ll email you a
            reminder a week before each payment is due.
          </p>
        ) : null}
      </div>

      {payments.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Payment history</h2>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="text-white">{formatPrice(p.amount, p.currency)}</p>
                  <p className="text-xs text-white/50">
                    Paid {fmtDate(p.paid_at)}
                    {p.period_end ? ` · covers until ${fmtDate(p.period_end)}` : ""}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-white/40">{p.reference}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
