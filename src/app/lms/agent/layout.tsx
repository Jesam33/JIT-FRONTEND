import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import AgentLayoutClient from "../../../components/AgentLayoutClient";

// The per-academy install identity must be in the SERVER-RENDERED <head>:
// Chrome evaluates a page's installability (and snapshots the manifest an
// install will use) at page load, before hydration. The client-side
// <link rel="manifest"> swap in lib/install-app.ts ran too late, so an
// "Install app" from this portal still installed the platform's root manifest
// ("Jorsas Tech", opening the marketing page). Reading the tenant cookie here
// lets us emit the academy's manifest link in the initial HTML; the client
// swap stays as a follow-up correction for a stale cookie (the guard re-pins
// it from the authenticated session a moment after load). Mirrors
// app/lms/staff/layout.tsx with role=agent so the installed app opens the
// Admission Marketer portal. No cookie (cold, logged-out visit): no override
// and the root platform manifest applies, exactly as before.
//
// The tab title is set here too, not in the root layout, so the portal reads
// "Admission Marketer Portal" instead of inheriting the platform's "Jorsas
// Tech". On a non-primary academy the client shell replaces it with the
// academy's own name once branding resolves (see AgentLayoutClient).
export async function generateMetadata(): Promise<Metadata> {
  const slug = (await cookies()).get("tenant")?.value?.trim();
  return {
    title: "Admission Marketer Portal",
    ...(slug ? { manifest: `/pwa/${encodeURIComponent(slug)}/manifest?role=agent` } : {}),
  };
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentLayoutClient>{children}</AgentLayoutClient>;
}
