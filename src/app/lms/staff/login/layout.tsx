import React from "react";
import type { Metadata } from "next";
import { tenantAuthMetadata } from "@/lib/auth-share-metadata";

// Pass-through layout that exists only to ship server-side metadata for the
// staff login page (page.tsx is a client component, so the metadata has to
// come from a layout). Gives shared https://{academy}.domain/lms/staff/login
// links the academy's own title, tab icon and og:image thumbnail instead of
// the generic Jorsas card. No-op (root metadata) on the primary domain.
export async function generateMetadata(): Promise<Metadata> {
  return tenantAuthMetadata("staff");
}

export default function StaffLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
