"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { STUDENT_API } from "../lib/api";
import { apiFetch } from "../lib/fetch-with-timeout";
import { tenantLoginPath, setTenantCookie, pinTenantFromLocation } from "../lib/tenant-client";

const PUBLIC_PATHS = [
  "/lms/login",
  "/lms/signup",
  "/lms/forgot-password",
  "/lms/reset-password",
  "/lms/setup-password",
  "/lms/invite",
];

export default function StudentGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const [loading, setLoading] = useState(!isPublicPath);

  useEffect(() => {
    if (isPublicPath) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("lms_student_token") ?? "";

    if (!token) {
      // A cold tap on an emailed deep link (e.g. /lms/app/modules/5?tenant=acme)
      // arrives here with no token. Pin the institute from the link's ?tenant=
      // BEFORE building the login path (so it doesn't fall back to the primary
      // slug), and carry the target as ?next= so login forwards there.
      pinTenantFromLocation();
      router.replace(tenantLoginPath("student", pathname));
      return;
    }

    const controller = new AbortController();
    apiFetch(STUDENT_API.me, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        // Re-pin the tenant cookie from THIS authenticated session so the
        // inactivity → login redirect keeps the student's institute instead of
        // falling back to the primary slug (jorsas). The cookie is otherwise
        // only set at fresh-login and goes stale (7-day TTL / incognito).
        if (data?.tenant?.slug) setTenantCookie(data.tenant.slug);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [isPublicPath, router]);

  if (loading) return <LoadingSpinner />;
  return <>{children}</>;
}
