"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

type Student = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
};

export default function StaffStudentsPage() {
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

  return (
    <section>
      <h1 className="text-2xl font-bold">Students</h1>
      <p className="text-sm text-white/70">Students enrolled in your assigned tracks.</p>

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">Loading...</div>
        ) : students.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">No students found for your tracks.</div>
        ) : (
          students.map((s) => (
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
