"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

type Student = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
};

// useSearchParams() must sit under a Suspense boundary in Next 16, so the page
// is a thin wrapper around the real content.
export default function StaffStudentsPage() {
  return (
    <Suspense fallback={<section><h1 className="text-2xl font-bold">Students</h1><p className="text-sm text-white/70">Loading...</p></section>}>
      <StudentsContent />
    </Suspense>
  );
}

function StudentsContent() {
  const searchParams = useSearchParams();
  // Search term comes from the top navbar (it redirects here as ?search=).
  const search = searchParams.get("search") ?? "";
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    apiFetchStaff(STAFF_API.students)
      .then((r) => r.json())
      .then((data) => { setStudents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = [s.first_name, s.last_name].filter(Boolean).join(" ").toLowerCase();
      const email = (s.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [students, search]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Students</h1>
      <p className="text-sm text-white/70">Students enrolled in your assigned tracks.</p>

      {search.trim() ? (
        <p className="mt-2 text-xs text-white/60">
          Showing results for &ldquo;{search.trim()}&rdquo;{" "}
          <Link href="/lms/staff/students" className="text-white underline underline-offset-2">Clear</Link>
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            {search.trim() ? `No students match "${search.trim()}".` : "No students found for your tracks."}
          </div>
        ) : (
          filteredStudents.map((s) => (
            <article key={s.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <h3 className="font-semibold">{s.first_name} {s.last_name}</h3>
              <p className="text-xs text-white/60">{s.email}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
