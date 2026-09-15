"use client";

// The printable certificate view. A certificate is a print artifact, so the
// "paper" is always white regardless of the dark portal theme — the institute's
// identity comes from its branding (logo, name, accent color) fetched the same
// way the portal shell does. window.print() prints ONLY the paper: the print
// stylesheet hides the whole body and re-shows #certificate-paper, so the
// sidebar/navbar chrome never lands on the printed page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { STUDENT_API, PUBLIC_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";
import { getToken } from "@/lib/lms-utils";
import { usePortalBranding } from "@/lib/use-portal-branding";
import type { StudentCertificate } from "@/lib/lms-types";
import LoadingSpinner from "@/components/LoadingSpinner";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function CertificateViewPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const branding = usePortalBranding(STUDENT_API.branding, "lms_student_token", PUBLIC_API.branding);

  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [studentName, setStudentName] = useState("");
  const [notFound, setNotFound] = useState(false);
  const token = getToken();

  // The certificates endpoint returns the student's full list; the view is a
  // client-side find. One small payload, no per-certificate endpoint needed.
  useEffect(() => {
    if (!token || !Number.isFinite(id)) return;
    apiFetch(STUDENT_API.certificates)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((list: StudentCertificate[]) => {
        const found = (Array.isArray(list) ? list : []).find((c) => c.id === id);
        if (found) setCertificate(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    apiFetch(STUDENT_API.me)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
        if (name) setStudentName(name);
      })
      .catch(() => {});
  }, [token]);

  if (notFound) {
    return (
      <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Certificate not found</h1>
        <p className="mt-2 text-sm text-white/70">This certificate doesn&apos;t exist or was revoked by your academy.</p>
        <Link href="/lms/app/certificates" className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
          Back to certificates
        </Link>
      </div>
    );
  }

  if (!certificate) return <LoadingSpinner />;

  const academyName = branding?.name?.trim() || "Jorsas Tech";
  const accent = branding?.primary_color ?? "#0f766e";
  const datesLine =
    certificate.start_date || certificate.end_date
      ? `from ${fmtDate(certificate.start_date) || "—"} to ${fmtDate(certificate.end_date) || "—"}`
      : null;

  return (
    <div className="pb-8">
      {/* Screen-only toolbar */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/lms/app/certificates" className="text-sm text-white/60 transition hover:text-white">
          ← All certificates
        </Link>
        <div className="flex items-center gap-3">
          {certificate.file_url ? (
            <a
              href={certificate.file_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open original file
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* The paper — print CSS prints only this */}
      <div
        id="certificate-paper"
        className="mx-auto max-w-3xl rounded-2xl bg-white p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)] print:shadow-none"
      >
        <div className="rounded-xl border-4 p-8 sm:p-12" style={{ borderColor: accent }}>
          {/* Institute identity */}
          <div className="flex flex-col items-center gap-3 text-center">
            {branding?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo_url} alt={academyName} className="h-14 w-14 rounded-full object-contain" />
            ) : null}
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">{academyName}</p>
          </div>

          <h1
            className="mt-8 text-center text-3xl font-bold uppercase tracking-wide text-neutral-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {certificate.title}
          </h1>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full" style={{ background: accent }} />

          <p className="mt-10 text-center text-base text-neutral-600">This certifies that</p>
          <p
            className="mt-3 text-center text-3xl font-semibold text-neutral-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {studentName || "—"}
          </p>

          <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-neutral-600">
            {certificate.course_title
              ? <>has successfully completed the program <strong className="font-semibold text-neutral-800">{certificate.course_title}</strong></>
              : <>has successfully completed the requirements set by {academyName}</>}
            {certificate.track_name ? <> (cohort: {certificate.track_name})</> : null}
            {datesLine ? <> , {datesLine}</> : "."}
          </p>

          {/* Footer: serial, issue date, signature */}
          <div className="mt-16 grid gap-8 sm:grid-cols-3 sm:items-end">
            <div className="text-center sm:text-left">
              <p className="border-t border-neutral-300 pt-2 text-xs text-neutral-500">
                {fmtDate(certificate.issued_at) || "Issued"}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">Date issued</p>
            </div>
            <div className="text-center">
              {certificate.serial ? (
                <p className="font-mono text-sm font-semibold text-neutral-700">№ {certificate.serial}</p>
              ) : null}
              <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">Certificate number</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="border-t border-neutral-300 pt-2 text-xs text-neutral-500" style={{ fontFamily: "var(--font-display)" }}>
                {academyName}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">Authorised signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS: hide the portal chrome, print only the paper. The
          visibility trick survives any wrapper the shell adds. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-paper, #certificate-paper * { visibility: visible; }
          #certificate-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            border-radius: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
