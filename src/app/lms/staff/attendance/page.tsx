"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";

type AttendanceRecord = {
  id: number;
  classroom_id: number;
  student_id: number;
  total_seconds?: number;
  status?: string;
  first_joined_at?: string;
  calculated_at?: string;
  student?: { id: number; first_name?: string; last_name?: string; email?: string };
  classroom?: { id: number; title: string };
};

export default function StaffAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    fetch(STAFF_API.attendance, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setRecords(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Attendance</h1>
      <p className="text-sm text-white/70">View attendance records for your classrooms.</p>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        {loading ? (
          <p className="text-sm text-white/60">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-white/60">No attendance records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/60">
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Classroom</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Duration</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{r.student?.first_name ?? "Student"} {r.student?.last_name ?? ""}</td>
                    <td className="py-2 pr-4">{r.classroom?.title ?? `Classroom #${r.classroom_id}`}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "present" ? "bg-green-500/20 text-green-400" : r.status === "late" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                        {r.status ?? "unknown"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{r.total_seconds ? `${Math.round(r.total_seconds / 60)}m` : "-"}</td>
                    <td className="py-2">{r.first_joined_at ? new Date(r.first_joined_at).toLocaleDateString() : "-"}</td>
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
