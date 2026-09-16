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
      <p className="mt-2 text-sm text-white/75">
        Time you spent in each class, out of how long the class ran. Attendance is computed after class ends.
      </p>
      <div className="mt-4 space-y-3">
        {attendanceItems.length ? (
          attendanceItems.map((item) => {
            // Prefer the server-computed pair (same rule that set the status);
            // fall back to the raw seconds + the 60-minute class default for any
            // older record that predates the fields.
            const attended = item.attended_minutes ?? Math.floor((item.total_seconds ?? 0) / 60);
            const lasted = item.duration_minutes ?? 60;
            return (
              <article key={`${item.class_type}-${item.class_id}-${item.calculated_at ?? "na"}`} className="rounded-xl border border-white/15 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.class_title ?? "Class Session"}</h3>
                    <p className="mt-1 text-xs text-white/60">{item.starts_at ? formatLocalDateTime(item.starts_at) : "Date unavailable"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-white">
                      {attended}
                      <span className="text-base font-normal text-white/50"> / {lasted} min</span>
                    </p>
                    <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${item.status === "present" ? "text-emerald-400" : item.status === "partial" ? "text-orange-400" : item.status === "late" ? "text-amber-400" : "text-rose-400"}`}>
                      stayed {lasted > 0 ? Math.min(100, Math.round((attended / lasted) * 100)) : 0}% of the class
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/75">
                  You were in this class for {attended} of {lasted} minutes{item.first_joined_at ? `, first joined ${formatLocalDateTime(item.first_joined_at)}` : ""}.
                </p>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border border-white/15 bg-black/30 p-4 text-sm text-white/75">No settled attendance records yet.</div>
        )}
      </div>
    </div>
  );
}
