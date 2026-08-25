"use client";

import { useRouter } from "next/navigation";
import { useIdleLogout } from "@/lib/use-idle-logout";

const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Drop-in inactivity guard for an authenticated portal. After the idle window it
 * clears the portal's token(s) and sends the user to its login page with
 * ?timeout=1, which <InactivityNotice /> turns into an on-theme banner.
 *
 * `redirectTo` may be a plain string OR a thunk. Pass a thunk (e.g.
 * `() => tenantLoginPath("student")`) when the login path depends on the
 * `tenant` cookie: the thunk is resolved at logout time, AFTER the portal has
 * re-pinned the cookie from its authenticated session, so the redirect keeps
 * the caller's institute instead of a stale/primary slug. A static string is
 * captured as-is (fine for portals with a fixed login URL).
 *
 * Renders nothing. Mount it only on authenticated pages (not login/setup).
 */
export default function IdleLogout({
  tokenKeys,
  redirectTo,
  timeoutMs = THIRTY_MINUTES,
}: {
  tokenKeys: string[];
  redirectTo: string | (() => string);
  timeoutMs?: number;
}) {
  const router = useRouter();

  useIdleLogout({
    timeoutMs,
    onIdle: () => {
      try {
        tokenKeys.forEach((key) => localStorage.removeItem(key));
      } catch {
        /* ignore storage access errors (private mode, etc.) */
      }
      const target = typeof redirectTo === "function" ? redirectTo() : redirectTo;
      const sep = target.includes("?") ? "&" : "?";
      router.replace(`${target}${sep}timeout=1`);
    },
  });

  return null;
}
