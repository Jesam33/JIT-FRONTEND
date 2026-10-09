"use client";

import { useMyEnrolment } from "@/lib/my-enrolment";

// "Enrolled" chip on a storefront course card, shown only to a visitor who is
// logged in to this academy's student portal and enrolled in this course. The
// cards themselves are server-rendered; this is the one client-side island.
export default function EnrolledBadge({ courseId, academySlug }: { courseId: number; academySlug: string }) {
  const mine = useMyEnrolment(academySlug);

  if (!mine || mine.courseId !== courseId) return null;

  const paused = mine.billing?.monthly && mine.billing.locked;

  return (
    <span
      className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${
        paused ? "bg-amber-500/90" : "bg-emerald-600/90"
      }`}
    >
      {paused ? "Enrolled · payment due" : "Enrolled"}
    </span>
  );
}
