"use client";

import { useEffect, useState } from "react";
import { STUDENT_MODULE_API } from "../../../../lib/api";
import { apiFetch } from "../../../../lib/fetch-with-timeout";
import CalendarTimetable from "../../../../components/CalendarTimetable";

type ScheduledClass = {
  id: number;
  module_id: number;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  meeting_url: string | null;
  meeting_id: string | null;
  meeting_password: string | null;
  location: string | null;
  status: string;
  module?: {
    id: number;
    title: string;
    course?: { id: number; title: string };
  };
};

export default function StudentTimetablePage() {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_student_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
      apiFetch(STUDENT_MODULE_API.timetable)
      .then((r) => r.json())
      .then((d) => { setClasses(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-sm text-white/60 mt-8 text-center">Loading timetable...</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>Timetable</h2>
        <p className="mt-1 text-sm text-white/50">View your scheduled classes on the calendar.</p>
      </div>
      {classes.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <p className="text-sm text-white/50">No classes scheduled yet.</p>
        </div>
      ) : (
        <CalendarTimetable classes={classes} />
      )}
    </div>
  );
}
