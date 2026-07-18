"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";

type ReportsData = {
  stats: {
    total_students: number;
    total_classes: number;
    total_tasks: number;
    total_submissions: number;
    graded_submissions: number;
  };
  recent_classes: { id: number; title: string; starts_at: string }[];
};

export default function StaffReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    fetch(STAFF_API.reports, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <section><h1 className="text-2xl font-bold">Reports</h1><p className="mt-2 text-sm text-white/60">Loading...</p></section>;

  const stats = data?.stats;

  return (
    <section>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-sm text-white/70">Attendance, task, and engagement analytics.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total Students", value: stats?.total_students ?? 0 },
          { label: "Total Classes", value: stats?.total_classes ?? 0 },
          { label: "Total Tasks", value: stats?.total_tasks ?? 0 },
          { label: "Submissions", value: stats?.total_submissions ?? 0 },
          { label: "Graded", value: stats?.graded_submissions ?? 0 },
          { label: "Grading Rate", value: (stats?.total_submissions && stats.total_submissions > 0) ? `${Math.round((stats.graded_submissions / stats.total_submissions) * 100)}%` : "0%" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-white/60">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {data?.recent_classes && data.recent_classes.length > 0 && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">Recent Classes</h3>
          <div className="mt-2 space-y-2">
            {data.recent_classes.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-white/60">{new Date(c.starts_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
