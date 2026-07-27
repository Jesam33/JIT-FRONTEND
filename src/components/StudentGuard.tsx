"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { STUDENT_API } from "../lib/api";
import { apiFetch } from "../lib/fetch-with-timeout";

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
    apiFetch(STUDENT_API.me, { signal: controller.signal })
      .then((res) => res.json())
      .then(() => setLoading(false))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [isPublicPath, router]);

  if (loading) return <LoadingSpinner />;
  return <>{children}</>;
}
