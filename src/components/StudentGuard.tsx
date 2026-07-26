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

    const controller = new AbortController();
    fetch(STUDENT_API.me, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        if (res.status === 401) {
          localStorage.removeItem("lms_student_token");
          router.replace("/lms/login?expired=1");
          return;
        }
        throw new Error("unauth");
      })
      .then(() => setLoading(false))
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (err.message !== "Unauthorized") {
          // Network error or similar — still show the UI, try again later
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [isPublicPath, router]);

  if (loading) return <LoadingSpinner />;
  return <>{children}</>;
}
