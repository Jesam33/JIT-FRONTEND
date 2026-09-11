import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import StaffLayoutClient from "../../../components/StaffLayoutClient";

// The per-academy install identity must be in the SERVER-RENDERED <head>:
// Chrome evaluates a page's installability (and snapshots the manifest an
// install will use) at page load, before hydration. The client-side
// <link rel="manifest"> swap in lib/install-app.ts ran too late, so an
// "Install app" from this portal still installed the platform's root manifest
// ("Jorsas Tech", opening the marketing page). Reading the tenant cookie here
// lets us emit the academy's manifest link in the initial HTML; the client
// swap stays as a follow-up correction for a stale cookie (the guard re-pins
// it from the authenticated session a moment after load). Mirrors
// app/lms/app/layout.tsx with role=staff so the installed app opens the staff
// portal. No cookie (cold, logged-out visit): no override and the root
// platform manifest applies, exactly as before.
export async function generateMetadata(): Promise<Metadata> {
  const slug = (await cookies()).get("tenant")?.value?.trim();
  return {
    title: "Staff Portal",
    ...(slug ? { manifest: `/pwa/${encodeURIComponent(slug)}/manifest?role=staff` } : {}),
  };
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffLayoutClient>{children}</StaffLayoutClient>;
}
