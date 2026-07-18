"use client";

import Link from "next/link";

export default function BecomeAnAgentPage() {
  return (
    <div className="min-h-screen bg-site-bg text-site-text">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Become a <span className="text-site-text">Jorsas Agent</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-site-text/60">
          Earn commissions by referring students to our courses. Help students find the right program and earn 10% on every enrollment.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg font-bold">1</div>
            <h3 className="mt-4 font-semibold">Apply</h3>
            <p className="mt-2 text-sm text-site-text/60">Fill out your application. Tell us about your experience and which courses you want to promote.</p>
          </div>
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg font-bold">2</div>
            <h3 className="mt-4 font-semibold">Get Approved</h3>
            <p className="mt-2 text-sm text-site-text/60">Our team reviews your application. Once approved, you will receive your portal access and referral code.</p>
          </div>
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg font-bold">3</div>
            <h3 className="mt-4 font-semibold">Earn Commissions</h3>
            <p className="mt-2 text-sm text-site-text/60">Refer students using your unique code or register them directly. Earn 10% commission per enrollment.</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="mt-2 text-site-text/60">Apply now and start earning commissions on every student you refer.</p>
          <Link
            href="/become-an-agent/apply"
            className="mt-6 inline-block rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
