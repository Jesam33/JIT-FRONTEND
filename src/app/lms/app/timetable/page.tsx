"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STUDENT_MODULE_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type ScheduledClass = {
  id: number;
  module_id: number;
  teacher_id: number;
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
  const [now, setNow] = useState(() => Date.now());

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_student_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    fetchWithTimeout(STUDENT_MODULE_API.timetable, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setClasses(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const { live, upcoming, past } = useMemo(() => {
    const live: ScheduledClass[] = [];
    const upcoming: ScheduledClass[] = [];
    const past: ScheduledClass[] = [];
    classes.forEach((c) => {
      const startsAt = new Date(c.starts_at).getTime();
      const endsAt = c.ends_at ? new Date(c.ends_at).getTime() : startsAt + 2 * 60 * 60 * 1000;
      if (startsAt <= now && endsAt > now) {
        live.push(c);
      } else if (startsAt > now) {
        upcoming.push(c);
      } else {
        past.push(c);
      }
    });
    return {
      live: live.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
      upcoming: upcoming.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
      past: past.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    };
  }, [classes, now]);

  function renderClassItem(c: ScheduledClass) {
    const startDate = new Date(c.starts_at);
    const isToday = startDate.toDateString() === new Date().toDateString();
    const canJoin = new Date(c.starts_at).getTime() <= now + 15 * 60 * 1000;

    return (
      <li key={c.id} className="rounded-lg border border-white/15 bg-black/30 px-3 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-white">{c.title}</p>
            <p className="mt-1 text-xs text-white/60">
              {isToday ? "Today" : startDate.toLocaleDateString()} &middot; {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
              {c.ends_at ? ` - ${new Date(c.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}` : ""}
            </p>
            {c.module ? (
              <Link href={`/lms/app/modules/${c.module_id}`} className="mt-1 inline-block text-xs text-blue-400 underline hover:text-blue-300">
                {c.module.title}
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {c.meeting_url && canJoin ? (
              <a
                href={c.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Join
              </a>
            ) : null}
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
              c.status === "scheduled" ? "bg-blue-500/20 text-blue-200" :
              c.status === "ongoing" ? "bg-emerald-500/20 text-emerald-200" :
              c.status === "completed" ? "bg-white/10 text-white/50" :
              "bg-emerald-500/20 text-emerald-200"
            }`}>
              {c.status}
            </span>
          </div>
        </div>
      </li>
    );
  }

  if (loading) return <p className="text-sm text-white/60">Loading timetable...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold">Timetable</h2>
      <p className="mt-2 text-sm text-white/70">Your upcoming and past scheduled classes.</p>

      <div className="mt-4 space-y-6 text-sm">
        {live.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-emerald-400">Live Now</h3>
            <ul className="space-y-2">{live.map(renderClassItem)}</ul>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-white/60">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="text-white/60">No upcoming classes.</p>
          ) : (
            <ul className="space-y-2">{upcoming.map(renderClassItem)}</ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-white/60">Past Classes</h3>
          {past.length === 0 ? (
            <p className="text-white/60">No past classes.</p>
          ) : (
            <ul className="space-y-2">{past.slice(0, 20).map(renderClassItem)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
