"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";

type Certificate = {
  id: number;
  student_id: number;
  course_id: number;
  title: string;
  file_url?: string;
  issued_at: string;
  student?: { id: number; first_name?: string; last_name?: string; email?: string };
};

export default function StaffCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  async function load() {
    const res = await fetch(STAFF_API.certificates, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCertificates(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function issueCertificate() {
    setIssuing(true);
    await fetch(STAFF_API.certificates, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ student_id: Number(studentId), course_id: Number(courseId), title, file_url: fileUrl || undefined }),
    });
    setIssuing(false);
    setStudentId(""); setCourseId(""); setTitle(""); setFileUrl("");
    await load();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Certificates</h1>
      <p className="text-sm text-white/70">View eligibility and issue certificates to students.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">Issue Certificate</h3>
          <div className="mt-2 grid gap-2">
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" type="number" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Course ID" type="number" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="Certificate file URL (optional)" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <button onClick={issueCertificate} disabled={issuing} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
              {issuing ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Issuing</span> : "Issue Certificate"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">Issued Certificates</h3>
          {loading ? (
            <p className="mt-2 text-sm text-white/60">Loading...</p>
          ) : certificates.length === 0 ? (
            <p className="mt-2 text-sm text-white/60">No certificates issued yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {certificates.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-xs text-white/60">{c.student?.first_name ?? "Student"} {c.student?.last_name ?? ""} &middot; {new Date(c.issued_at).toLocaleDateString()}</p>
                  {c.file_url ? <a href={c.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline">View certificate</a> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
