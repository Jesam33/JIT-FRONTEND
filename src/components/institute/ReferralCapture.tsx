"use client";

import { useEffect } from "react";
import { captureReferral } from "@/lib/referral";

// Renders nothing: it exists to remember the ?ref= an Admission Marketer's
// shared link carried, so the registration form further into the storefront can
// prefill it. Mounted in the /i/[slug] layout, which wraps the academy's landing
// page and every course page under it, so both share-link shapes are captured.
export default function ReferralCapture({ slug }: { slug: string }) {
  useEffect(() => {
    captureReferral(slug);
  }, [slug]);

  return null;
}
