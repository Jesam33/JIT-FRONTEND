"use client";

import Link from "next/link";

// Certificates were moved off the staff portal — issuing is now an
// admin-only action (see OwnerAdminController + /lms/admin/certificates).
// This stub stays so any bookmarked /lms/staff/certificates URL lands on a
// clear explanation instead of a dead route or a form staff shouldn't use.
export default function StaffCertificatesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Certificates</h1>
      <p className="mt-1 text-sm text-white/70">
        Certificates are now issued by your administrator.
      </p>

      <div className="mt-4 max-w-xl rounded-lg border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm text-white/80">
          Certification is managed centrally so every certificate carries consistent
          branding and a single record of who has been awarded what.
          If a student in your cohort has completed their course, ask your admin to
          issue the certificate from the admin dashboard.
        </p>
        <p className="mt-3 text-sm text-white/60">
          Students can always view the certificates they&rsquo;ve earned from their own
          Certificates page.
        </p>
        <Link
          href="/lms/staff/app"
          className="mt-4 inline-block rounded bg-white px-4 py-2 text-sm font-semibold text-black transition hover:brightness-90"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
