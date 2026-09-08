"use client";

// The "Course payments" sidebar entry was folded into the Profile page as its
// "Payment & account setup" tab. This route now forwards there so any old
// bookmark / deep link lands on the right tab instead of 404ing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/lms/admin/profile?tab=payment");
  }, [router]);
  return null;
}
