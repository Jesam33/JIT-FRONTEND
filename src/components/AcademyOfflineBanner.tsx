"use client";

import { usePathname } from "next/navigation";

/**
 * "Your academy is offline" notice for the student, staff and agent portals.
 *
 * An owner taking their academy offline is a "keep teaching, stop selling"
 * decision: everyone already enrolled keeps full access, so nothing on these
 * pages breaks and there would otherwise be no sign at all that the institute's
 * public page is hidden and no new students can join. This is that sign.
 *
 * Driven by `branding.academy_accepting`, which the branding endpoint already
 * returns to every portal shell, so it costs no extra request.
 *
 * Suppressed on the logged-out auth screens (login, reset, set-password) that
 * render inside these same shells: telling somebody at the door that the
 * academy is not taking students is confusing when they are already a student
 * there, and those screens are reached by existing users far more often than by
 * new ones. Login is refused separately by the backend when it matters.
 *
 * `audience="agent"` swaps the reassurance line: an Admission Marketer is not
 * here to consume courses, they are here to register students, and that is the
 * one thing the offline switch actually takes away from them
 * (AgentController::registerStudent refuses).
 */
const AUTH_PREFIXES = ["/login", "/staff/login", "/setup-password", "/forgot-password", "/reset-password"];

export default function AcademyOfflineBanner({
  accepting,
  name,
  audience = "member",
}: {
  accepting?: boolean | null;
  name?: string | null;
  audience?: "member" | "agent";
}) {
  const pathname = usePathname() ?? "";

  if (accepting !== false) return null;
  if (AUTH_PREFIXES.some((p) => pathname.endsWith(p))) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
      <p className="text-sm font-semibold text-amber-200 [html.light_&]:text-amber-800">
        {name ? `${name} is not accepting new students right now` : "This academy is not accepting new students right now"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-amber-200/80 [html.light_&]:text-amber-900/80">
        {audience === "agent"
          ? "Registering a student will be refused until it reopens. Students you have already enrolled keep their full access."
          : "You still have full access to your courses, classes and materials. Only new registrations are paused."}
      </p>
    </div>
  );
}
