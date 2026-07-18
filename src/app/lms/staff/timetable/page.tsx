"use client";

import { useEffect, useMemo, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
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
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = STAFF_API.scheduledClasses + (filter ? `?status=${filter}` : "");
      const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setClasses(Array.isArray(d) ? d : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [token, filter]);

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

  const sorted = useMemo(() =>
    [...classes].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
  [classes]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Timetable</h1>
      <p className="text-sm text-white/70">Scheduled classes across your modules.</p>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-xs text-white/60">Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-white/60">Loading...</p>
      ) : sorted.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">No scheduled classes. Create one via a Module.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {sorted.map((c) => {
            const start = new Date(c.starts_at);
            const end = c.ends_at ? new Date(c.ends_at) : null;
            const isPast = end ? end.getTime() < now : start.getTime() < now;

            return (
              <div key={c.id} className="rounded-lg border border-white/15 bg-black/30 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{c.title}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {start.toLocaleDateString()} &middot; {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {end ? ` - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                    </p>
                    {c.module ? (
                      <p className="mt-0.5 text-xs text-white/50">Module: {c.module.title}{c.module.course ? ` (${c.module.course.title})` : ""}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.meeting_url && !isPast ? (
                      <a href={c.meeting_url} target="_blank" rel="noreferrer" className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500">Join</a>
                    ) : null}
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                      c.status === "scheduled" ? "bg-blue-500/20 text-blue-200" :
                      c.status === "ongoing" ? "bg-emerald-500/20 text-emerald-200" :
                      c.status === "completed" ? "bg-white/10 text-white/50" :
                      "bg-emerald-500/20 text-emerald-200"
                    }`}>{c.status}</span>
                    {c.status === "scheduled" ? (
                      <button onClick={() => setConfirmCancel(c.id)} className="text-xs text-emerald-400 underline hover:text-emerald-300">Cancel</button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
