"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff, okJson, getStaffToken } from "../../../../lib/fetch-with-timeout";
import { useTeachingBase } from "@/lib/teaching-base";

type ModuleItem = {
  id: number;
  title: string;
  course: { id: number; title: string } | null;
  status: string;
  sort_order: number;
};

export default function StaffDashboardPage() {
  // In-page links must stay inside the shell showing this page (staff portal or
  // the owner portal's Teaching area); see lib/teaching-base.
  const base = useTeachingBase();
  const [dash, setDash] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const token = getStaffToken();
    if (!token) return;

    // Never render an error body as if it were dashboard data: a non-OK
    // response (e.g. a tenant/auth hiccup) must surface as error+retry, not a
    // misleading all-zero "Teaching overview". 401s redirect upstream.
    setLoadError(false);
    setLoading(true);
    apiFetchStaff(STAFF_API.dashboard)
      .then(okJson)
      .then((p) => { setDash(p); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Couldn&apos;t load your dashboard</h1>
        <p className="mt-2 text-sm text-white/70">We hit a snag reaching your teaching workspace. This is usually temporary.</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
        >
          Try again
        </button>
      </div>
    );
  }

  const modules: ModuleItem[] = dash?.modules_list ?? [];
  const upcomingClasses: any[] = dash?.upcoming_classes_list ?? [];
  const stats = dash ?? {};

  // Counted from the loaded list, the same source the old Published/Drafts tiles
  // used, so restyling doesn't quietly change the numbers.
  const publishedCount = modules.filter((m) => m.status === "published").length;
  const draftCount = modules.filter((m) => m.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Overview: one card holding a stat STRIP, not a grid of tiles.
          Seven bordered tiles inside a bordered card read as seven separate things
          to deal with (and wrapped badly at six columns, leaving one orphan), and
          three of them restated the same module count. The same figures as
          label/value pairs separated by hairlines read as one summary, which is
          the grammar the student dashboard already uses for its progress strip. */}
      <section className="rounded-2xl border border-white/15 bg-black/30 p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Staff dashboard</p>
        <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Teaching overview</h1>
        <p className="mt-2 text-sm text-white/70">Tracks, students, modules, and classes for your courses.</p>

        <div className="mt-6 flex flex-col divide-y divide-white/10 sm:flex-row sm:divide-x sm:divide-y-0">
          <div className="flex-1 pb-4 sm:pb-0 sm:pr-6">
            <p className="text-xs text-white/55">Tracks</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.tracks ?? 0}</p>
          </div>
          <div className="flex-1 py-4 sm:py-0 sm:px-6">
            <p className="text-xs text-white/55">Students</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.students ?? 0}</p>
          </div>
          <div className="flex-1 py-4 sm:py-0 sm:px-6">
            <p className="text-xs text-white/55">Modules</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.modules ?? 0}</p>
            <p className="mt-1 text-xs text-white/45">
              {publishedCount} published &middot; {draftCount} draft
            </p>
          </div>
          <div className="flex-1 py-4 sm:py-0 sm:px-6">
            <p className="text-xs text-white/55">Classes</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.scheduled_classes ?? 0}</p>
            <p className="mt-1 text-xs text-white/45">{stats.upcoming_scheduled ?? 0} upcoming</p>
          </div>
          {/* The one figure here that is a job rather than a fact, so it is the one
              that links somewhere. */}
          <a href={`${base}/tasks`} className="group flex-1 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-xs text-amber-300">Pending submissions</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.pending_submissions ?? 0}</p>
            <p className="mt-1 text-xs text-white/45 transition group-hover:text-white/80">Review and grade</p>
          </a>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        {/* Modules */}
        <section className="rounded-2xl border border-white/15 bg-black/30 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Content</p>
              <h2 className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Modules</h2>
              <p className="mt-1 text-sm text-white/60">
                {modules.length > 0 ? `${modules.length} modules across your courses` : "No modules created yet."}
              </p>
            </div>
            <a
              href={`${base}/modules`}
              className="shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/20"
            >
              Manage
            </a>
          </div>

          {/* One divided list, not a grid of bordered rows: a module is a line of
              information, and boxing each one inside the section's box is what made
              this page feel like a wall of rectangles. The status is a coloured dot
              and a word, which carries the same signal as the old chip. */}
          {modules.length > 0 && (
            <div className="mt-4 divide-y divide-white/10">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center gap-4 py-3">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      mod.status === "published" ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{mod.title}</p>
                    <p className="mt-0.5 truncate text-xs text-white/50">{mod.course?.title ?? "Unknown course"}</p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-medium ${mod.status === "published" ? "text-emerald-300" : "text-amber-300"}`}>
                    {mod.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming classes */}
        <section className="self-start rounded-2xl border border-white/15 bg-black/30 p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Schedule</p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Upcoming classes</h2>

          {upcomingClasses.length > 0 ? (
            /* Date rail on the left, class on the right: the same rows as before,
               but the date is a column you can scan down instead of a small grey
               line inside another box. */
            <div className="mt-4 divide-y divide-white/10">
              {upcomingClasses.map((c: any) => {
                const when = new Date(c.starts_at);
                return (
                  <div key={c.id} className="flex gap-4 py-3">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-white/50">
                        {when.toLocaleDateString([], { month: "short" })}
                      </p>
                      <p className="text-xl font-semibold leading-tight text-white">
                        {when.toLocaleDateString([], { day: "numeric" })}
                      </p>
                      <p className="text-[11px] text-white/50">
                        {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-white/10 pl-4">
                      <p className="truncate text-sm font-medium text-white">{c.title}</p>
                      <p className="mt-0.5 truncate text-xs text-white/50">{c.module_title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/50">No upcoming classes scheduled.</p>
          )}

          <div className="mt-5">
            <a
              href={`${base}/timetable`}
              className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/20"
            >
              View full timetable
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
