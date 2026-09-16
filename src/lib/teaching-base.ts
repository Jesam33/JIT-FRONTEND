"use client";

import { usePathname } from "next/navigation";

/**
 * Base path for the teaching pages the CURRENT shell is showing.
 *
 * The staff pages are shared by two portals (the staff portal, and the owner
 * portal's Teaching area at /lms/admin/teaching/*). Their in-page links have to
 * stay inside whichever one the viewer is in, or an owner clicking "Timetable"
 * on the teaching dashboard would be thrown out of the admin shell into the
 * staff one.
 *
 * Every staff page starts with "/lms/staff/"; only the owner copy needs
 * rewriting, so this stays a one-line prefix swap at the call site.
 */
export function useTeachingBase(): string {
  const pathname = usePathname() ?? "";

  return pathname.startsWith("/lms/admin/teaching") ? "/lms/admin/teaching" : "/lms/staff";
}

/** Rewrite a `/lms/staff/...` path into the current shell's teaching base. */
export function teachingHref(base: string, path: string): string {
  return path.startsWith("/lms/staff") ? base + path.slice("/lms/staff".length) : path;
}
