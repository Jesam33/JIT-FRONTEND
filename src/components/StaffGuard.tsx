"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STAFF_API } from "../lib/api";

const PUBLIC_PATHS = [
  "/lms/staff/login",
  "/lms/staff/forgot-password",
  "/lms/staff/reset-password",
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
      router.replace("/lms/staff/login");
      return;
    }

    fetch(STAFF_API.me, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        throw new Error("unauth");
      })
      .then(() => setLoading(false))
      .catch(() => router.replace("/lms/staff/login"));
  }, [isPublicPath, router]);

  if (loading) return null;
  return <>{children}</>;
}
