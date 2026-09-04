"use client";

import { useMemo, useState } from "react";

type CalendarClass = {
  id: number;
  // 'classroom' (legacy lms_classrooms) or 'scheduled' (LmsScheduledClass). The
  // timetable endpoint merges both tables, so id alone isn't unique across them —
  // React keys must be namespaced by class_type. Optional: the staff timetable
  // sends a single table (no class_type), where id is already unique on its own.
  class_type?: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  module?: { id: number; title: string; course?: { id: number; title: string } } | null;
  meta?: React.ReactNode;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function useCalendarNav() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  return {
    year, month,
    prev: () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); },
    next: () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); },
    today: () => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); },
  };
}

export default function CalendarTimetable({ classes, renderActions, studentJoinPath }: { classes: CalendarClass[]; renderActions?: (c: CalendarClass) => React.ReactNode; studentJoinPath?: string }) {
  const { year, month, prev, next, today } = useCalendarNav();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const classesByDay = useMemo(() => {
    const map: Record<number, CalendarClass[]> = {};
    classes.forEach((c) => {
      const d = new Date(c.starts_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(c);
      }
    });
    return map;
  }, [classes, year, month]);

  const now = Date.now();
  const todayDate = new Date();

  const selectedClasses = selectedDay ? (classesByDay[selectedDay] ?? []) : [];
  const selectedTitle = selectedDay ? `${MONTHS[month]} ${selectedDay}, ${year}` : "";

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={today} className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/5 transition">
            Today
          </button>
          <button onClick={prev} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/5 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={next} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/5 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-site-secondary/20 bg-site-secondary/10 px-3 py-2 text-center text-xs text-site-secondary md:hidden">
        ← Swipe to see full calendar →
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-2xl border border-site-border/20 bg-black/30">
        <div className="min-w-[1000px] md:min-w-0">
          <div className="grid grid-cols-7 border-b border-white/20">
          {DAYS.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-white/40">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const cls = day ? classesByDay[day] : undefined;
            const isToday = day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
            const isSelected = day === selectedDay;
            const hasLive = cls?.some((c) => new Date(c.starts_at).getTime() <= now && (c.ends_at ? new Date(c.ends_at).getTime() > now : false));

            return (
              <button
                key={i}
                disabled={!day}
                onClick={() => day && setSelectedDay(day)}
                className={`relative min-h-[72px] border-b border-r border-white/20 p-1.5 text-left transition outline-none
                  ${!day ? "bg-transparent cursor-default" : "hover:bg-white/[0.03] cursor-pointer"}
                  ${isSelected ? "bg-white/[0.06]" : ""}
                  ${isToday ? "bg-red-500/15" : ""}`}
              >
                {day && (
                  <>
                    {isToday && (
                      <span className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b bg-red-500 px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wider" style={{ color: '#fff' }}>
                        Today
                      </span>
                    )}
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mt-1.5
                      ${isToday ? "bg-red-500 text-white" : isSelected ? "bg-white/15 text-white" : "text-white/70"}`}>
                      {day}
                    </span>
                    {cls && cls.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {cls.slice(0, 2).map((c) => {
                          const start = new Date(c.starts_at);
                          const timeStr = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
                          const isLive = hasLive && new Date(c.starts_at).getTime() <= now && (c.ends_at ? new Date(c.ends_at).getTime() > now : start.getTime() + 7200000 > now);
                          return (
                            <div key={`${c.class_type ?? "c"}-${c.id}`} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${isLive ? "bg-emerald-500/20" : c.status === "completed" ? "bg-gray-500/20" : "bg-blue-500/20"}`} style={{ color: isLive ? '#059669' : c.status === "completed" ? '#64748b' : '#2563eb' }}>
                              {timeStr} {c.title}
                            </div>
                          );
                        })}
                        {cls.length > 2 && <span className="text-[10px] text-white/40 ml-1">+{cls.length - 2} more</span>}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Live
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500/60" />
          Scheduled
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          Completed
        </span>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="rounded-2xl border border-site-border/20 bg-black/30 p-5">
          <h3 className="text-sm font-semibold text-white">{selectedTitle}</h3>
          {selectedClasses.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No classes on this day.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {selectedClasses
                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                .map((c) => {
                  const start = new Date(c.starts_at);
                  const end = c.ends_at ? new Date(c.ends_at) : null;
                  const isLive = start.getTime() <= now && (end ? end.getTime() > now : start.getTime() + 7200000 > now);

                  return (
                    <div key={`${c.class_type ?? "c"}-${c.id}`} className="rounded-lg border border-site-border/15 bg-black/40 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{c.title}</p>
                          <p className="mt-0.5 text-xs text-white/50">
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            {end ? ` - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}` : ""}
                          </p>
                          {c.module && (
                            <p className="mt-0.5 text-[11px] text-white/40 truncate">
                              {c.module.title}{c.module.course ? ` · ${c.module.course.title}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {studentJoinPath && isLive ? (
                            <a href={studentJoinPath} className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium hover:bg-emerald-500 transition" style={{ color: '#fff' }}>
                              Join Now
                            </a>
                          ) : null}
                          {renderActions?.(c)}
                          <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                            c.status === "ongoing" || isLive ? "bg-emerald-500/20" :
                            c.status === "completed" ? "bg-gray-500/20" :
                            c.status === "cancelled" ? "bg-red-500/20" :
                            "bg-blue-500/20"
                          }`} style={{ color: c.status === "ongoing" || isLive ? '#059669' : c.status === "completed" ? '#64748b' : c.status === "cancelled" ? '#dc2626' : '#2563eb' }}>
                            {isLive && c.status !== "ongoing" ? "live" : c.status || "class"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
