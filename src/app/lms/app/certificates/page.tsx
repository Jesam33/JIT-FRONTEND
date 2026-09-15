"use client";

// The student's issued certificates. Rows come from the (old but previously
// unused) /api/frontend/lms/certificates endpoint; auto-issued ones carry the
// cohort dates + serial, hand-issued ones may just be a title + external link.
// Each row links to the printable certificate view at /lms/app/certificates/[id].

import { useEffect, useState } from "react";
import Link from "next/link";
import { STUDENT_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";
import { getToken } from "@/lib/lms-utils";
import type { StudentCertificate } from "@/lib/lms-types";
import LoadingSpinner from "@/components/LoadingSpinner";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<StudentCertificate[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    setLoadError(false);
    apiFetch(STUDENT_API.certificates)
      .then((r) => {
        if (!r.ok) throw new Error(`Certificates request failed (${r.status})`);
        return r.json();
      })
      .then((list: StudentCertificate[]) => setCertificates(Array.isArray(list) ? list : []))
      .catch(() => { setLoadError(true); setCertificates([]); });
  }, [token]);

  if (!certificates) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Certificates</h1>
        <p className="mt-1 text-sm text-white/60">
          Certificates your academy has awarded you. Open one to view or print it.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Couldn&apos;t load your certificates. Refresh the page to try again.
        </div>
      ) : null}

      {certificates.length === 0 && !loadError ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <p className="text-sm text-white/70">No certificates yet.</p>
          <p className="mt-1 text-xs text-white/50">
            When you complete a program, your academy issues your certificate and it appears here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <Link
              key={c.id}
              href={`/lms/app/certificates/${c.id}`}
              className="group rounded-2xl border border-white/15 bg-black/30 p-5 transition hover:border-white/30 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{c.title}</p>
                  <p className="mt-0.5 truncate text-sm text-white/70">{c.course_title ?? c.track_name ?? "—"}</p>
                </div>
                <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-white/40 group-hover:text-white/60">
                  View
                </span>
              </div>
              {c.start_date || c.end_date ? (
                <p className="mt-3 text-xs text-white/55">
                  {c.start_date ? fmtDate(c.start_date) : "?"} – {c.end_date ? fmtDate(c.end_date) : "?"}
                </p>
              ) : null}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="text-white/50">Issued {fmtDate(c.issued_at)}</span>
                {c.serial ? <span className="font-medium text-white/60">№ {c.serial}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
