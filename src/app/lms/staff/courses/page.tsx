"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

type Course = { id: number; title: string; description?: string };

export default function StaffCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    apiFetchStaff(STAFF_API.assignedCourses)
      .then((r) => r.json())
      .then((data) => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Courses</h1>
      <p className="text-sm text-white/70">Courses assigned to you.</p>

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">Loading...</div>
        ) : courses.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">No courses assigned to you yet.</div>
        ) : (
          courses.map((c) => (
            <article key={c.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <h3 className="font-semibold">{c.title}</h3>
              {c.description ? <p className="text-xs text-white/60">{c.description}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
