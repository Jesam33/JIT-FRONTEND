"use client";

import { useCallback, useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import CalendarTimetable from "../../../../components/CalendarTimetable";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import ConfirmDialog from "../../../../components/ConfirmDialog";

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
  status: string;
  module?: {
    id: number;
    title: string;
    course?: { id: number; title: string };
  };
};

export default function StaffTimetablePage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeout(STAFF_API.scheduledClasses, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setClasses(Array.isArray(d) ? d : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const cancelClass = async (id: number) => {
    try {
      await fetchWithTimeout(STAFF_API.scheduledClass(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmCancel(null);
      await load();
    } catch { /* ignore */ }
  };

  if (loading) return <p className="text-sm text-white/60 mt-8 text-center">Loading timetable...</p>;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>Timetable</h1>
        <p className="mt-1 text-sm text-white/50">Scheduled classes across your modules.</p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <p className="text-sm text-white/50">No scheduled classes. Create one via a Module.</p>
        </div>
      ) : (
        <CalendarTimetable
          classes={classes}
          renderActions={(c) =>
            c.status === "scheduled" ? (
              <button onClick={() => setConfirmCancel(c.id)} className="text-xs text-red-400 underline hover:text-red-300 transition">
                Cancel
              </button>
            ) : undefined
          }
        />
      )}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Cancel Class"
        message="Cancel this scheduled class?"
        onConfirm={() => cancelClass(confirmCancel!)}
        onCancel={() => setConfirmCancel(null)}
      />
    </section>
  );
}
