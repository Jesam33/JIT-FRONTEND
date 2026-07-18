"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";

type ModuleItem = {
  id: number;
  title: string;
  course: { id: number; title: string } | null;
  status: string;
  sort_order: number;
};

export default function StaffDashboardPage() {
  const [dash, setDash] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lms_staff_token") ?? "";
    if (!token) return;

    fetch(STAFF_API.dashboard, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((p) => { setDash(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const modules: ModuleItem[] = dash?.modules_list ?? [];
  const upcomingClasses: any[] = dash?.upcoming_classes_list ?? [];
  const stats = dash ?? {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 dark:border-white/20 dark:bg-white/[0.03]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Staff Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Teaching overview</h1>
          <p className="mt-2 text-sm text-white/70">Tracks, students, modules, and classes for your courses.</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Tracks</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.tracks ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Students</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.students ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Modules</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.modules ?? 0} <span className="text-sm text-white/50">/ {stats.modules_published ?? 0}</span></p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Published</p>
            <p className="mt-2 text-2xl font-semibold text-white">{modules.filter((m) => m.status === "published").length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Drafts</p>
            <p className="mt-2 text-2xl font-semibold text-white">{modules.filter((m) => m.status === "draft").length}</p>
          </div>
          <a href="/lms/staff/tasks" className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 block">
            <p className="text-xs text-amber-300">Pending submissions</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.pending_submissions ?? 0}</p>
          </a>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Scheduled classes</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.scheduled_classes ?? 0} <span className="text-sm text-white/50">/ {stats.upcoming_scheduled ?? 0}</span></p>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        {/* Modules */}
        <section className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Content</p>
              <h2 className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Modules</h2>
            </div>
            <a href="/lms/staff/modules" className="rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/15">Manage</a>
          </div>
          <p className="mt-2 text-sm text-white/60">
            {modules.length > 0 ? `${modules.length} modules across your courses` : "No modules created yet."}
          </p>

          {modules.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{mod.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{mod.course?.title ?? "Unknown course"}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    mod.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                  }`}>
                    {mod.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming classes */}
        <section className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 md:p-6 self-start">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Schedule</p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Upcoming classes</h2>

          {upcomingClasses.length > 0 ? (
            <div className="mt-5 space-y-3">
              {upcomingClasses.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{c.module_title}</p>
                  <p className="mt-1 text-[11px] text-white/40">{new Date(c.starts_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/50">No upcoming classes scheduled.</p>
          )}

          <div className="mt-5">
            <a href="/lms/staff/timetable" className="inline-block rounded-lg border border-white/15 bg-white/8 px-4 py-2 text-xs text-white/70 transition hover:bg-white/15">
              View full timetable
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
