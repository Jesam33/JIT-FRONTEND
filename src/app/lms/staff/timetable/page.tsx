"use client";

import { useCallback, useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import CalendarTimetable from "../../../../components/CalendarTimetable";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";
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
  const [hostMessage, setHostMessage] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetchStaff(STAFF_API.scheduledClasses);
      const d = await res.json();
      setClasses(Array.isArray(d) ? d : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const cancelClass = async (id: number) => {
    try {
      await apiFetchStaff(STAFF_API.scheduledClass(id), {
        method: "DELETE",
      });
      setConfirmCancel(null);
      await load();
    } catch { /* ignore */ }
  };

  // Host the live class as moderator. The tab is opened synchronously (inside the
  // click gesture) so popup blockers don't kill it, then redirected to the JaaS
  // room once the moderator token is minted. Scheduled classes are the only kind
  // on the staff timetable, so class_type is always "scheduled" here.
  const hostClass = async (id: number) => {
    setHostMessage("");
    const win = window.open("about:blank", "_blank");
    try {
      const res = await apiFetchStaff(STAFF_API.classroomMeetingToken(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_type: "scheduled" }),
      });
      const p = await res.json();
      if (!res.ok || !p.jwt || !p.room || !p.domain || !p.app_id) {
        if (win) win.close();
        setHostMessage(p?.message ?? "Could not start the live class.");
        return;
      }
      const url = `https://${p.domain}/${p.app_id}/${p.room}?jwt=${encodeURIComponent(p.jwt)}`;
      if (win) win.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      if (win) win.close();
      setHostMessage("Could not start the live class.");
    }
  };

  if (loading) return <p className="text-sm text-white/60 mt-8 text-center">Loading timetable...</p>;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>Timetable</h1>
        <p className="mt-1 text-sm text-white/50">Scheduled classes across your modules.</p>
      </div>

      {hostMessage ? (
        <p className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{hostMessage}</p>
      ) : null}

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <p className="text-sm text-white/50">No scheduled classes. Create one via a Module.</p>
        </div>
      ) : (
        <CalendarTimetable
          classes={classes}
          renderActions={(c) => (
            <>
              {c.status !== "cancelled" && c.status !== "completed" ? (
                <button onClick={() => hostClass(c.id)} className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium hover:bg-emerald-500 transition" style={{ color: "#fff" }}>
                  Host
                </button>
              ) : null}
              {c.status === "scheduled" ? (
                <button onClick={() => setConfirmCancel(c.id)} className="text-xs text-red-400 underline hover:text-red-300 transition">
                  Cancel
                </button>
              ) : null}
            </>
          )}
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
