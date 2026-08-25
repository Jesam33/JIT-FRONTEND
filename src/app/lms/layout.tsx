import React from "react";

// Pass-through layout. Every /lms/* area supplies its own chrome:
//   - /lms/app     → student portal (StudentSidebar)
//   - /lms/staff   → staff portal (StaffLayoutClient / StaffSidebar)
//   - /lms/admin   → owner admin (OwnerLayoutClient / OwnerSidebar)
//   - /lms/agent   → agent portal
// AppChrome already hides the marketing Header/Footer on /lms/*, so this layer
// must add nothing — no shared header, no padding — or it would double up on
// each portal's own layout.
export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
