"use client";

// The standalone "Public page" editor was merged into Customisation as a tab.
// This route now just forwards there so any old bookmark / deep link still lands
// somewhere sensible instead of 404ing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PublicProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/lms/admin/branding");
  }, [router]);
  return null;
}
