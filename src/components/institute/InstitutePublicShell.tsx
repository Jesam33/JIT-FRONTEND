"use client";

import React, { useEffect } from "react";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePublicInstituteBranding, isBranded } from "@/lib/use-portal-branding";
import { pinTenantFromLocation } from "@/lib/tenant-client";

// Wraps an UNAUTHENTICATED institute page (student/staff login, password setup
// + reset) so it wears the institute's colors + font — the same white-label
// treatment the authenticated portals already get from their layout shells.
//
// The tenant is resolved from the URL's invite/setup token or the tenant header
// (see usePublicInstituteBranding); with no signal it falls back to the primary
// palette, i.e. the current default theme, so nothing regresses for JIT. Purely
// presentational: brandingStyle() sets the CSS custom properties + font on this
// wrapper, storefrontBackgroundStyle() paints the institute's ambient glow (only
// when one is set), and [data-branded] lets globals.css tint the same accents
// (primary action buttons) it already themes inside the portals — no redesign.
export default function InstitutePublicShell({ children }: { children: React.ReactNode }) {
  const branding = usePublicInstituteBranding();

  // Pin the institute from an emailed link's ?tenant= so a student's reset →
  // login journey stays on the right portal instead of defaulting to primary.
  useEffect(() => {
    pinTenantFromLocation();
  }, []);

  return (
    <div
      style={{ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }}
      data-branded={isBranded(branding) ? "" : undefined}
    >
      {children}
    </div>
  );
}
