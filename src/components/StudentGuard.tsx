"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { STUDENT_API } from "../lib/api";

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
      router.replace("/lms/login");
      return;
    }

    fetch(STUDENT_API.me, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        throw new Error("unauth");
      })
      .then(() => setLoading(false))
      .catch(() => router.replace("/lms/login"));
  }, [isPublicPath, router]);

  if (loading) return <LoadingSpinner />;
  return <>{children}</>;
}
