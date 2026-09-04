"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";
import { useToast } from "@/components/ToastProvider";

type Certificate = {
  id: number;
  student_id: number;
  student_name: string;
  course_id: number | null;
  course_title: string | null;
  title: string;
  file_url: string | null;
  issued_at: string | null;
};

type StudentOption = {
  id: number;
  name: string;
  email: string | null;
  course_id: number | null;
  course_title: string | null;
};

type CourseOption = { id: number; title: string };

const DEFAULT_TITLE = "Certificate of Completion";

export default function OwnerCertificatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [fileUrl, setFileUrl] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OWNER_API.certificates, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load certificates (HTTP ${res.status}).`);
        return;
      }
      const json = await res.json();
      setCertificates(json.certificates ?? []);
      setStudents(json.students ?? []);
      setCourses(json.courses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    load();
  }, [load, router]);

  // Picking a student pre-fills the course from their enrolment (still editable).
  const onPickStudent = (value: string) => {
    setStudentId(value);
    const s = students.find((st) => String(st.id) === value);
    if (s && s.course_id) setCourseId(String(s.course_id));
  };

  const resetForm = () => {
    setStudentId("");
    setCourseId("");
    setTitle(DEFAULT_TITLE);
    setFileUrl("");
    setSaveMsg(null);
  };

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!studentId) {
      setSaveMsg({ kind: "err", text: "Choose a student." });
      return;
    }
    if (!t) {
      setSaveMsg({ kind: "err", text: "Enter a certificate title." });
      return;
    }
    if (fileUrl.trim() && !/^https?:\/\//i.test(fileUrl.trim())) {
      setSaveMsg({ kind: "err", text: "The certificate link must start with http:// or https://" });
      return;
    }

    const body = {
      student_id: Number(studentId),
      course_id: courseId ? Number(courseId) : null,
      title: t,
      file_url: fileUrl.trim() || null,
    };

    setIssuing(true);
    setSaveMsg(null);
    try {
      const res = await fetch(OWNER_API.issueCertificate, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: json?.message || `Could not issue (HTTP ${res.status}).` });
        return;
      }
      const studentName = students.find((s) => String(s.id) === studentId)?.name ?? "the student";
      toast(`Certificate issued to ${studentName}.`, "success");
      resetForm();
      load();
    } catch (err) {
      setSaveMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setIssuing(false);
    }
  };

  const revoke = async (c: Certificate) => {
    setRevokingId(c.id);
    try {
      const res = await fetch(OWNER_API.revokeCertificate(c.id), {
        method: "DELETE",
        headers: { Accept: "application/json", ...ownerAuthHeaders() },
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.message || `Could not revoke certificate (HTTP ${res.status}).`);
        return;
      }
      toast("Certificate revoked.", "success");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevokingId(null);
      setConfirmingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40";

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Certificates</h1>
        <p className="mt-1 text-sm text-site-muted">
          {loading
            ? "Loading…"
            : `${certificates.length} certificate${certificates.length === 1 ? "" : "s"} issued`}
        </p>
      </div>

      {/* Issue */}
      <div ref={formRef} className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Issue a certificate</h2>
          <p className="mt-1 text-sm text-site-muted">
            Award a certificate to a student. Paste a link to the certificate PDF (Google Drive,
            Canva, etc.) if you have one. The student sees it on their Certificates page.
          </p>
        </div>

        <form onSubmit={issue} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Student
              </label>
              <select value={studentId} onChange={(e) => onPickStudent(e.target.value)} className={inputClass}>
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.email ? ` · ${s.email}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Course (optional)
              </label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
                <option value="">No specific course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Certificate title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Certificate of Completion"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
              Certificate link (optional)
            </label>
            <input
              type="url"
              inputMode="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/… (link to the certificate file)"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-white/45">
              Paste a Google Drive, Canva, or any public link to the certificate. No file uploads.
            </p>
          </div>
          {!loading && students.length === 0 ? (
            <p className="text-sm text-amber-300/80">
              No students yet. Once students enrol, you can issue certificates to them here.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={issuing || !studentId || !title.trim()}
              className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {issuing ? "Issuing…" : "Issue certificate"}
            </button>
            {saveMsg && (
              <p className={`text-sm ${saveMsg.kind === "ok" ? "text-emerald-300" : "text-red-300"}`}>{saveMsg.text}</p>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Issued</th>
                <th className="px-5 py-3 font-semibold">File</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-white">{c.student_name}</td>
                  <td className="px-5 py-3 text-site-muted">{c.title}</td>
                  <td className="px-5 py-3 text-site-muted">{c.course_title ?? "—"}</td>
                  <td className="px-5 py-3 text-site-muted">{fmtDate(c.issued_at)}</td>
                  <td className="px-5 py-3">
                    {c.file_url ? (
                      <a
                        href={c.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-site-primary underline underline-offset-2 hover:brightness-110"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {confirmingId === c.id ? (
                        <>
                          <span className="text-xs text-white/60">Revoke?</span>
                          <button
                            type="button"
                            onClick={() => revoke(c)}
                            disabled={revokingId === c.id}
                            className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                          >
                            {revokingId === c.id ? "Revoking…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(c.id)}
                          className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !certificates.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-site-muted">
                    No certificates issued yet. Award your first certificate above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
