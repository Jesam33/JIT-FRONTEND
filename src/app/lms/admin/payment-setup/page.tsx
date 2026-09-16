"use client";

// The compulsory payout step of academy onboarding.
//
// Reached two ways, both deliberate:
//   1. straight after "set up your password" (see /lms/admin/setup), so it sits
//      between account creation and the dashboard; and
//   2. by the shell gate in OwnerLayoutClient, which forwards any owner page here
//      while `billing_required` is true — so tapping the dashboard (or any deep
//      link) lands on this screen until a settlement bank is linked.
//
// The form itself is the same <PayoutSettings> the Profile page's Payment tab
// renders; only the framing and the "continue" action are different. Backend
// enforcement lives on Tenant::requiresPayoutSetup() and is deliberately off for
// the platform's own academy and for any deployment whose Paystack keys are not
// live, so this screen can never strand an owner with no way to comply.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PayoutSettings from "@/components/owner/PayoutSettings";
import { getOwnerToken } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";

export default function OwnerPaymentSetupPage() {
  const router = useRouter();
  const [configured, setConfigured] = useState(false);
  const [gatewayReady, setGatewayReady] = useState(true);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
    }
  }, [router]);

  // PayoutSettings reports back after every load/save. On success we also nudge
  // the shell to refetch its identity, otherwise its `billing_required` flag is
  // still stale-true and it would bounce the owner straight back here.
  const handleStatus = useCallback((isConfigured: boolean, isGatewayReady: boolean) => {
    setConfigured(isConfigured);
    setGatewayReady(isGatewayReady);
    if (isConfigured) {
      window.dispatchEvent(new Event("owner-identity-refresh"));
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold display-gradient sm:text-3xl">Set up your payments</h1>
          <p className="mt-2 max-w-2xl text-sm text-site-muted">
            One last step before your dashboard. Link the bank account your course fees should settle
            to — students pay your academy directly, and the platform fee is deducted automatically.
          </p>
        </div>
        {/* Available only once the account is linked: the dashboard gate would
            send the owner right back here otherwise. */}
        {configured ? (
          <Link
            href="/lms/admin"
            className="shrink-0 rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110"
          >
            Continue to dashboard →
          </Link>
        ) : null}
      </div>

      {/* Only reachable-but-blocked when the gateway is live; on an environment
          without Paystack keys the shell gate stays off and the owner simply
          navigates here themselves. */}
      {!gatewayReady ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          The payment gateway isn&apos;t enabled on this environment yet, so you can continue to your
          dashboard and link a payout bank once it&apos;s live.
        </div>
      ) : !configured ? (
        <div className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-site-muted">
          Your dashboard stays locked until this is set up.
        </div>
      ) : null}

      <PayoutSettings
        onStatus={handleStatus}
        heading={
          <p className="max-w-2xl text-sm text-site-muted">
            Use the exact legal name and account number on your settlement account. We register those
            details with the payment provider, so a match lets payouts activate without a manual
            review.
          </p>
        }
      />

      {configured ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-emerald-400/25 bg-emerald-400/[0.06] p-5">
          <p className="text-sm text-emerald-100">
            Payments are set up. You can change this any time under Profile → Payment.
          </p>
          <Link
            href="/lms/admin"
            className="ml-auto rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110"
          >
            Continue to dashboard →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
