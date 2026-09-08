"use client";

import Link from "next/link";

// Shape of the 402 body returned by the EnsureSubscriptionActive middleware.
export type FrozenInfo = {
  message?: string | null;
  contact?: string | null;
  subscription?: {
    state?: string;
    current_period_end?: string | null;
    grace_ends_at?: string | null;
  } | null;
};

/**
 * The owner-portal freeze screen. Shown by OwnerLayoutClient in place of every
 * owner page (except billing, which stays reachable so the owner can renew)
 * once the backend reports the subscription as frozen. Deliberately focused: a
 * clear message, a renew action, an optional contact, and log out. Branded via
 * the shell's CSS variables so it still feels like the institute.
 */
export default function OwnerFrozenScreen({
  info,
  brandName,
  onLogout,
}: {
  info: FrozenInfo | null;
  brandName?: string | null;
  onLogout: () => void;
}) {
  const message =
    info?.message ||
    "Your subscription is past due. Please contact management services to restore access to your dashboard.";
  const contact = info?.contact || null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[24px] border border-white/15 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 text-2xl">
          🔒
        </div>

        <h1 className="text-xl font-semibold text-white sm:text-2xl">
          {brandName ? `${brandName} is paused` : "Your dashboard is paused"}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-site-muted">
          {message}
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <Link
            href="/lms/admin/billing"
            className="w-full rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-black transition hover:brightness-90 sm:w-auto sm:min-w-[220px]"
          >
            Renew subscription
          </Link>

          {contact ? (
            <a
              href={`mailto:${contact}?subject=${encodeURIComponent("Subscription support")}`}
              className="text-sm text-white/80 underline underline-offset-2 hover:text-white"
            >
              Contact management services
            </a>
          ) : null}

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-site-muted transition hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
