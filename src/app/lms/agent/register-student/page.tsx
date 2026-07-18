"use client";

import { useEffect, useState } from "react";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type Course = { id: number; title: string; slug: string; price: string };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

export default function AgentRegisterStudentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", course_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWithTimeout(AGENT_API.courses, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetchWithTimeout(AGENT_API.registerStudent, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed."); return; }
      setDone(true);
    } catch { setError("Network error."); }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-2xl">&#10003;</div>
        <h2 className="mt-4 text-lg font-semibold">Student Registered</h2>
        <p className="mt-1 text-sm text-site-text/60">The student has been registered successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold">Register a Student</h2>
      <p className="mt-1 text-sm text-site-text/60">Register a student directly. You earn 10% commission on the course price.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name *" required className="rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name *" required className="rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
        </div>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email *" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone *" required className="w-full rounded-xl border border-site-border bg-site-surface px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30" />
        <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} required className="w-full rounded-xl border border-site-border bg-site-bg px-4 py-3 text-sm text-site-text outline-none focus:border-site-text/30">
          <option value="">Select course *</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title} - &#8358;{parseFloat(c.price).toLocaleString()}</option>
          ))}
        </select>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button type="submit" disabled={submitting} className="w-full rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
          {submitting ? "Registering..." : "Register Student"}
        </button>
      </form>
    </div>
  );
}
