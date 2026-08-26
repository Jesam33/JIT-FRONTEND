"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DashboardPayload } from "../../../lib/lms-types";
import { formatLocalDateTime, formatRelativeCountdown, canJoinClassroom, getToken } from "../../../lib/lms-utils";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../lib/api";
import { apiFetch } from "../../../lib/fetch-with-timeout";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload>({});
  const [joinMessage, setJoinMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [joining, setJoining] = useState<number | null>(null);

  const token = useMemo(() => getToken(), []);

  const studentName = useMemo(() => {
    const firstName = data.profile?.first_name ?? "Student";
    const lastName = data.profile?.last_name ?? "";
    return `${firstName} ${lastName}`.trim();
  }, [data.profile?.first_name, data.profile?.last_name]);

  const learningMode = data.profile?.learning_mode ?? null;
  const isLiveStudent = learningMode === "live";
  const isPrerecordedStudent = learningMode === "pre_recorded";

  const continueLearning = useMemo(() => {
    if (isPrerecordedStudent) {
      return data.next_lesson
        ? {
            title: data.profile?.course_title ?? "Continue Learning",
            subtitle: data.next_lesson.title,
            actionLabel: "Open Lesson",
            actionHref: data.next_lesson.file_url,
          }
        : {
            title: data.profile?.course_title ?? "Continue Learning",
            subtitle: "Your next recommended lesson will appear here.",
            actionLabel: "Browse Materials",
            actionHref: null,
          };
    }
    return {
      title: data.profile?.course_title ?? "Continue Learning",
      subtitle: "Pick up from your course workspace and stay on track.",
      actionLabel: "Open Classroom",
      actionHref: null,
    };
  }, [data.next_lesson, data.profile?.course_title, isPrerecordedStudent]);

  useEffect(() => {
    if (!token) return;

    // Never render an error body as if it were dashboard data: a non-OK
    // response (e.g. a tenant/auth hiccup that 404s the student lookup) must
    // surface as an error+retry, not a misleading empty "No course selected"
    // shell. 401s are already handled upstream (fetchWithTimeout redirects).
    setLoadError(false);
    setLoading(true);
    apiFetch(STUDENT_API.dashboard)
      .then((r) => {
        if (!r.ok) throw new Error(`Dashboard request failed (${r.status})`);
        return r.json();
      })
      .then((p) => { setData(p); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, [token, reloadKey]);

  useEffect(() => {
    if (!joinMessage) return;
    const timeoutId = window.setTimeout(() => setJoinMessage(""), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [joinMessage]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function joinClassroom(id: number) {
    setJoinMessage("");
    setJoining(id);
    const response = await apiFetch(STUDENT_API.classroomJoin(id), {
      method: "POST",
    });
    const payload = await response.json();
    setJoining(null);
    if (!response.ok) {
      setJoinMessage(payload?.message ?? "You cannot join this class yet.");
      return;
    }
    if (payload?.launch_url) {
      window.open(payload.launch_url, "_blank", "noopener,noreferrer");
    }
  }

  function openMaterials() {
    router.push("/lms/app/materials");
  }

  function openTimetable() {
    router.push("/lms/app/timetable");
  }

  function openChats() {
    router.push("/lms/app/chats");
  }

  function openTask(taskId: number) {
    router.push(`/lms/tasks/${taskId}`);
  }

  const pendingTasks = useMemo(() => (data.tasks ?? []).filter((item) => item.status === "pending"), [data.tasks]);
  const unreadNotifications = useMemo(() => (data.notifications ?? []).filter((item) => !item.is_read), [data.notifications]);

  if (loading) return <LoadingSpinner />;

  if (loadError) {
    return (
      <div className="space-y-6 pb-8">
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Couldn&apos;t load your dashboard</h1>
          <p className="mt-2 text-sm text-white/70">We hit a snag reaching your course workspace. This is usually temporary.</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 ">
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">My Progress</p>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(((data.summary?.modules_completed ?? 0) / (data.summary?.modules_total ?? 1)), 1))}`}
              />
              <defs><linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
            </svg>
            <span className="text-2xl font-bold">{Math.round(((data.summary?.modules_completed ?? 0) / Math.max(data.summary?.modules_total ?? 1, 1)) * 100)}%</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{data.profile?.course_title ?? "No course selected yet"}</h1>
            <p className="mt-1 text-sm text-white/70">
              {data.summary?.modules_completed ?? 0} of {data.summary?.modules_total ?? 0} modules completed
            </p>
            <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.round(((data.summary?.modules_completed ?? 0) / Math.max(data.summary?.modules_total ?? 1, 1)) * 100)}%` }} />
            </div>
            <p className="mt-3 text-sm text-white/50">Good day, {studentName} &middot; {new Date().toLocaleDateString([], { dateStyle: "full" })}</p>
            {unreadNotifications.length ? <p className="mt-1 text-xs text-amber-200">You have {unreadNotifications.length} unread notification{unreadNotifications.length > 1 ? "s" : ""}.</p> : null}
          </div>
        </div>
        {joinMessage ? <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{joinMessage}</p> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-7 xl:min-h-[320px]">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Continue Learning</p>
          <h2 className="mt-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{continueLearning.title}</h2>
          <p className="mt-2 text-white/75">{continueLearning.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {continueLearning.actionHref ? (
              <a href={continueLearning.actionHref} target="_blank" rel="noreferrer" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
                {continueLearning.actionLabel}
              </a>
            ) : (
              <button type="button" onClick={() => router.push(isLiveStudent ? "/lms/app/classroom" : "/lms/app/materials")} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
                {continueLearning.actionLabel}
              </button>
            )}
            <button type="button" onClick={openMaterials} className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white">
              Open Materials
            </button>
          </div>
        </article>

        {isLiveStudent ? (
          <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-5 xl:min-h-[220px]">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Upcoming Class</p>
            {data.upcoming_class ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{data.upcoming_class.title}</h2>
                <p className="mt-2 text-sm text-white/75">{formatRelativeCountdown(data.upcoming_class.starts_at, currentTime)}</p>
                <p className="mt-1 text-sm text-white/60">{formatLocalDateTime(data.upcoming_class.starts_at)}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => joinClassroom(data.upcoming_class!.id)}
                    disabled={!canJoinClassroom(data.upcoming_class.starts_at, currentTime) || joining === data.upcoming_class!.id}
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {joining === data.upcoming_class!.id ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Joining...</span> : "Join Class"}
                  </button>
                  <button type="button" onClick={openTimetable} className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white">
                    View Timetable
                  </button>
                </div>
                {!canJoinClassroom(data.upcoming_class.starts_at, currentTime) ? (
                  <p className="mt-4 text-xs text-white/55">Join opens 5 minutes before class starts.</p>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-sm text-white/75">No more classes scheduled right now.</p>
            )}
          </article>
        ) : (
          <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-5 xl:min-h-[220px]">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Next Lesson</p>
            {data.next_lesson ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{data.next_lesson.title}</h2>
                <p className="mt-2 text-sm text-white/75">{data.next_lesson.course_title ?? "Continue your next pre-recorded lesson."}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={data.next_lesson.file_url} target="_blank" rel="noreferrer" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
                    Open Lesson
                  </a>
                  <button type="button" onClick={openMaterials} className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white">
                    View All Materials
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-white/75">Your next recommended lesson will appear here.</p>
            )}
          </article>
        )}

        <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-5 xl:min-h-[320px]">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Pending Tasks</p>
          <div className="mt-4 space-y-3 text-sm text-white/75">
            {pendingTasks.slice(0, 3).map((task) => (
              <button key={task.id} type="button" onClick={() => openTask(task.id)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
                <p className="font-medium text-white">{task.title}</p>
                <p className="mt-1 text-xs text-white/60">Due {new Date(task.due_at).toLocaleString()}</p>
              </button>
            ))}
            {!pendingTasks.length ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">No pending tasks right now.</div> : null}
            <p className="text-xs text-white/55">When you open a task and submit, it becomes locked and moves to submitted/graded status.</p>
          </div>
        </article>

        <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-7 xl:min-h-[220px]">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Learning Progress</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Classes Total</p>
              <p className="mt-2 text-2xl font-semibold">{data.summary?.classes_total ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Classes Attended</p>
              <p className="mt-2 text-2xl font-semibold">{data.summary?.classes_attended ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Attendance Rate</p>
              <p className="mt-2 text-2xl font-semibold">{data.summary?.attendance_rate ?? 0}%</p>
            </div>
          </div>
          {(data.summary?.modules_total ?? 0) > 0 ? (
            <div className="mt-4">
              <p className="text-xs text-white/60">
                Module Progress: {data.summary?.modules_completed ?? 0} / {data.summary?.modules_total ?? 0}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.round(((data.summary?.modules_completed ?? 0) / (data.summary?.modules_total ?? 1)) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-8 xl:min-h-[220px]">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Announcements</p>
          <div className="mt-4 space-y-3 text-sm text-white/75">
            {(data.notifications ?? []).slice(0, 3).map((item) => {
              const href =
                item.reference_type === "task" && item.reference_id ? `/lms/tasks/${item.reference_id}`
                : item.reference_type === "group_chat" ? "/lms/app/chats"
                : item.reference_type === "scheduled_class" ? "/lms/app/classroom"
                : item.reference_type === "module" ? (item.reference_id ? `/lms/app/modules/${item.reference_id}` : "/lms/app/modules")
                : item.reference_type === "course" ? "/lms/app/modules"
                : null;
              return (
                <div
                  key={item.id}
                  role={href ? "button" : undefined}
                  tabIndex={href ? 0 : undefined}
                  onClick={href ? () => router.push(href) : undefined}
                  onKeyDown={href ? (e) => { if (e.key === "Enter") router.push(href); } : undefined}
                  className={`rounded-xl border border-white/10 bg-white/5 px-4 py-3 ${href ? "cursor-pointer" : ""}`}
                >
                  <p className="font-medium text-white">{item.title}</p>
                  {item.body ? <p className="mt-1 text-xs text-white/60">{item.body}</p> : null}
                </div>
              );
            })}
            {!(data.notifications ?? []).length ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">No announcements yet.</div> : null}
            <p className="text-xs text-white/55">Task and grading alerts appear here and are also sent by email when enabled.</p>
          </div>
        </article>

        <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-4 xl:min-h-[220px]">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Calendar Preview</p>
          <div className="mt-4 space-y-3 text-sm text-white/75">
            {(data.timetable ?? []).slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/60">{formatLocalDateTime(item.starts_at)}</p>
              </div>
            ))}
            {!(data.timetable ?? []).length ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">No upcoming events.</div> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-white/15 bg-black/30 p-6 xl:col-span-12">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Quick Actions</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => router.push("/lms/app/classroom")} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white">
              Join Class
            </button>
            <button type="button" onClick={openTimetable} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white">
              View Timetable
            </button>
            <button type="button" onClick={openMaterials} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white">
              Open Materials
            </button>
            <button type="button" onClick={openChats} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white">
              More
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
