"use client";

import { useEffect, useState } from "react";
import { STUDENT_API } from "@/lib/api";

// What a visitor to an academy's public pages is already enrolled in there, so
// the storefront can show "Enrolled" / "Go to my course" instead of offering to
// sell it again (and, with one course per academy, can say so on the others).
//
// Only knowable when the visitor is logged in to the student portal in THIS
// browser on THIS site: it reads the portal's own token and asks
// /api/frontend/lms/me. Anyone else is just a visitor (null). The backend still
// refuses a duplicate registration by email either way (EnrollmentGuard).
//
// Plain fetch on purpose, not apiFetch: a stale token on a public page must not
// bounce the visitor to the login screen or the billing page.

export type MyEnrolment = {
  courseId: number;
  courseTitle: string;
  // Monthly-course standing (null for one-time courses).
  billing: {
    monthly: boolean;
    locked: boolean;
    status?: string | null;
    paid_until?: string | null;
    due?: boolean;
  } | null;
};

type MeResponse = {
  tenant?: { slug?: string } | null;
  enrolment?: { course_id: number; course_title: string } | null;
  billing?: MyEnrolment["billing"];
};

// One request per page load, shared by every card and the register panel.
let cache: { token: string; promise: Promise<MeResponse | null> } | null = null;

function loadMe(token: string): Promise<MeResponse | null> {
  if (cache?.token === token) return cache.promise;
  const promise = fetch(STUDENT_API.me, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
    .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
    .catch(() => null);
  cache = { token, promise };
  return promise;
}

/**
 * The visitor's enrolment at the academy with this slug, or null (not logged
 * in, logged in to a different academy, or not enrolled). `undefined` while
 * still checking, so callers can avoid flashing the wrong state.
 */
export function useMyEnrolment(academySlug: string | undefined): MyEnrolment | null | undefined {
  const [state, setState] = useState<MyEnrolment | null | undefined>(undefined);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("lms_student_token");
    } catch {
      token = null;
    }

    let cancelled = false;
    const done = (value: MyEnrolment | null) => {
      if (!cancelled) setState(value);
    };

    if (!token || !academySlug) {
      // Resolved on the next tick so the effect body itself sets no state.
      Promise.resolve().then(() => done(null));
    } else {
      loadMe(token).then((me) => {
        const sameAcademy = me?.tenant?.slug === academySlug;
        done(
          sameAcademy && me?.enrolment
            ? { courseId: me.enrolment.course_id, courseTitle: me.enrolment.course_title, billing: me.billing ?? null }
            : null,
        );
      });
    }

    return () => {
      cancelled = true;
    };
  }, [academySlug]);

  return state;
}

/** Where "Go to my course" leads: the academy's own student portal. */
export function studentPortalHref(academySlug: string, path = "/lms/app"): string {
  // Same rule as the storefront header's "Student login" link (InstituteHeader).
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  return appDomain
    ? `https://${academySlug}.${appDomain}${path}`
    : `${path}?tenant=${encodeURIComponent(academySlug)}`;
}
