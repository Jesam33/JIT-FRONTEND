"use client";

import { useEffect, useMemo, useState } from "react";
import type { AttendanceItem } from "../../../../lib/lms-types";
import { formatLocalDateTime, getToken } from "../../../../lib/lms-utils";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../../lib/api";
import { apiFetch } from "../../../../lib/fetch-with-timeout";

export default function StudentAttendancePage() {
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;

    apiFetch(STUDENT_API.attendance)
      .then((res) => res.json())
      .then((payload) => setAttendanceItems(Array.isArray(payload) ? payload : []))
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-8">
      <h2 className="text-xl font-semibold">Attendance</h2>
      <p className="mt-2 text-sm text-white/75">Past class attendance is computed after class end and shown here.</p>
      <div className="mt-4 space-y-3">
        {attendanceItems.length ? (
          attendanceItems.map((item) => (
            <article key={`${item.classroom_id}-${item.calculated_at ?? "na"}`} className="rounded-xl border border-white/15 bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.class_title ?? "Class Session"}</h3>
                  <p className="mt-1 text-xs text-white/60">{item.starts_at ? formatLocalDateTime(item.starts_at) : "Date unavailable"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${item.status === "present" ? "bg-emerald-500/20 text-emerald-600" : item.status === "late" ? "bg-amber-500/20 text-amber-600" : item.status === "partial" ? "bg-orange-500/20 text-orange-600" : "bg-rose-500/20 text-rose-600"}`}>
                  {item.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/75">Attended {Math.floor(item.total_seconds / 60)} minutes{item.first_joined_at ? `, first joined ${formatLocalDateTime(item.first_joined_at)}` : ""}.</p>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-white/15 bg-black/30 p-4 text-sm text-white/75">No settled attendance records yet.</div>
        )}
      </div>
    </div>
  );
}
