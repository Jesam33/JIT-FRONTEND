"use client";

import { useCallback, useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff, okJson } from "../../../../lib/fetch-with-timeout";

type LeaderboardRow = {
  student_id: number;
  name: string;
  email: string | null;
  // Null until the student has at least one graded submission.
  avg_score: number | null;
  graded_count: number;
  modules_completed: number;
  attendance_pct: number | null;
  attendance_sessions: number;
};

type LeaderboardPayload = {
  rows: LeaderboardRow[];
  modules_total: number;
};

type Course = { id: number; title: string };

// Medal-style accent for the podium ranks; everyone else is plain.
function rankClass(rank: number): string {
  if (rank === 1) return "bg-amber-400/20 text-amber-300";
  if (rank === 2) return "bg-white/20 text-white";
  if (rank === 3) return "bg-orange-500/20 text-orange-300";
  return "bg-white/5 text-white/60";
}

function scoreClass(score: number | null): string {
  if (score === null) return "text-white/40";
  if (score >= 70) return "text-emerald-400";
  return "text-amber-400";
}

export default function StaffLeaderboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [payload, setPayload] = useState<LeaderboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const url = courseFilter === "all"
        ? STAFF_API.leaderboard
        : `${STAFF_API.leaderboard}?course_id=${courseFilter}`;
      const data = await okJson<LeaderboardPayload>(await apiFetchStaff(url));
      setPayload({ rows: Array.isArray(data?.rows) ? data.rows : [], modules_total: data?.modules_total ?? 0 });
    } catch {
      setError(true);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [token, courseFilter]);

  useEffect(() => {
    if (!token) return;
    apiFetchStaff(STAFF_API.assignedCourses)
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <p className="text-sm text-white/70">
        Students ranked by average graded-task score, then modules completed, then attendance.
      </p>

      {courses.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCourseFilter("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              courseFilter === "all"
                ? "bg-white text-black"
                : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            All courses
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourseFilter(c.id)}
              className={`max-w-[240px] truncate rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                courseFilter === c.id
                  ? "bg-white text-black"
                  : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        {loading ? (
          <p className="text-sm text-white/60">Loading…</p>
        ) : error ? (
          <p className="text-sm text-white/60">
            Couldn&apos;t load the leaderboard.{" "}
            <button type="button" onClick={load} className="text-white underline underline-offset-2">Retry</button>
          </p>
        ) : !payload || payload.rows.length === 0 ? (
          <p className="text-sm text-white/60">No students enrolled in your courses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/60">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Avg score</th>
                  <th className="pb-2 pr-4">Graded</th>
                  <th className="pb-2 pr-4">Modules</th>
                  <th className="pb-2">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {payload.rows.map((row, i) => (
                  <tr key={row.student_id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankClass(i + 1)}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="block font-medium text-white">{row.name}</span>
                      {row.email ? <span className="block text-xs text-white/40">{row.email}</span> : null}
                    </td>
                    <td className={`py-2.5 pr-4 font-semibold tabular-nums ${scoreClass(row.avg_score)}`}>
                      {row.avg_score !== null ? `${row.avg_score}%` : "—"}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-white/70">{row.graded_count}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-white/70">
                      {row.modules_completed}/{payload.modules_total}
                    </td>
                    <td className="py-2.5 tabular-nums text-white/70">
                      {row.attendance_pct !== null ? `${row.attendance_pct}%` : "—"}
                      {row.attendance_sessions > 0 ? (
                        <span className="ml-1 text-xs text-white/35">({row.attendance_sessions})</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
