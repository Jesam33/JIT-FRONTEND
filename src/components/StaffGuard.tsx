"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STAFF_API } from "../lib/api";
import { apiFetchStaff } from "../lib/fetch-with-timeout";
import { tenantLoginPath, setTenantCookie } from "../lib/tenant-client";

const PUBLIC_PATHS = [
  "/lms/staff/login",
  "/lms/staff/forgot-password",
  "/lms/staff/reset-password",
  // Owner-invited staff land here with no token yet — it must stay public, or
  // the guard bounces them to login before they can set a password (the invite
  // "set password" bug).
  "/lms/staff/setup-password",
];

export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const [loading, setLoading] = useState(!isPublicPath);

  useEffect(() => {
    if (isPublicPath) {
      return;
    }

    const token = localStorage.getItem("lms_staff_token") ?? "";

    if (!token) {
      router.replace(tenantLoginPath("staff"));
      return;
    }

    let cancelled = false;

    apiFetchStaff(STAFF_API.me, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        // Re-pin the tenant cookie from THIS authenticated session so the
        // inactivity → login redirect keeps the staff member's institute
        // instead of falling back to the primary slug (jorsas).
        if (data?.tenant?.slug) setTenantCookie(data.tenant.slug);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // A GENUINE 401 has already been handled inside apiFetchStaff:
        // onUnauthorized cleared the token and did a hard redirect to the
        // staff login. There is nothing left to do here, and calling
        // setLoading(false) would briefly flash the dashboard mid-redirect.
        if (err?.message === "Unauthorized") return;
        // Any OTHER failure (a cold-server timeout, a momentary network reset,
        // a transient 5xx — already retried inside apiFetchStaff) is NOT proof
        // the session is invalid. Bouncing to login here was the "dashboard
        // flashes then kicks back to login" bug. Instead render the portal, as
        // StudentGuard does; the dashboard has its own error+retry if the data
        // truly can't be reached.
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPublicPath, router]);

  if (loading) return null;
  return <>{children}</>;
}
