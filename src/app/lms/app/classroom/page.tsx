"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AttendanceItem, SdkSignaturePayload } from "../../../../lib/lms-types";
import { formatLocalDateTime, canJoinClassroom, isClassEnded, isClassActiveWindow, getToken } from "../../../../lib/lms-utils";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_MODULE_API, STUDENT_API } from "../../../../lib/api";

type TimetableItem = {
  id: number;
  class_type?: "classroom" | "scheduled";
  title: string;
  starts_at: string;
  ends_at: string | null;
  meeting_id?: string | null;
  meeting_password?: string | null;
  meeting_url?: string | null;
  session_thumbnail_url?: string | null;
  recording_url?: string | null;
  module_id?: number | null;
};

export default function StudentClassroomPage() {
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; email?: string }>({});
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);
  const [joinMessage, setJoinMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isJoiningEmbeddedClass, setIsJoiningEmbeddedClass] = useState(false);
  const [isJoiningAttendance, setIsJoiningAttendance] = useState(false);
  const [isClassLive, setIsClassLive] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close pseudo-fullscreen with Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const token = useMemo(() => getToken(), []);

  const studentName = useMemo(() => {
    return `${profile.first_name ?? "Student"} ${profile.last_name ?? ""}`.trim();
  }, [profile.first_name, profile.last_name]);

  useEffect(() => {
    if (!token) return;

    Promise.allSettled([
      fetch(STUDENT_MODULE_API.timetable, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setTimetable(Array.isArray(p) ? p : [])),
      fetch(STUDENT_API.attendance, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setAttendanceItems(Array.isArray(p) ? p : [])),
      fetch(STUDENT_API.profile, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setProfile(p)),
    ]).then(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!joinMessage) return;
    const timeoutId = window.setTimeout(() => setJoinMessage(""), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [joinMessage]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const sortedTimetable = useMemo(() => {
    return [...timetable].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [timetable]);

  const activeClass = useMemo(() => {
    return sortedTimetable.find((item) => {
      const date = new Date(item.starts_at);
      const now = new Date(currentTime);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate() && !isClassEnded(item.starts_at, item.ends_at, currentTime);
    });
  }, [sortedTimetable, currentTime]);

  const upcomingClasses = useMemo(() => {
    return sortedTimetable.filter((item) => new Date(item.starts_at).getTime() > currentTime);
  }, [sortedTimetable, currentTime]);

  const todayAttendance = useMemo(() => {
    if (!activeClass) return null;
    return attendanceItems.find((item) => item.classroom_id === activeClass.id) ?? null;
  }, [activeClass, attendanceItems]);

  const isScheduledClass = activeClass?.class_type === "scheduled";
  const isClassroomType = activeClass?.class_type === "classroom" || !activeClass?.class_type;

  const handleZoomMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const { type, detail } = event.data || {};
    switch (type) {
      case "zoom-joined":
        setIsClassLive(true);
        setJoinMessage("You are now in the live classroom.");
        break;
      case "zoom-error":
        setIsClassLive(false);
        setJoinMessage(detail || "Failed to join the meeting.");
        break;
      case "zoom-leave":
        setIsClassLive(false);
        setIframeUrl(null);
        setJoinMessage("You left the classroom.");
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleZoomMessage);
    return () => window.removeEventListener("message", handleZoomMessage);
  }, [handleZoomMessage]);

  useEffect(() => {
    if (!isClassLive || !activeClass || !iframeUrl) return;
    if (isClassEnded(activeClass.starts_at, activeClass.ends_at, currentTime)) {
      setIsClassLive(false);
      setIframeUrl(null);
      setJoinMessage("Class time has ended.");
    }
  }, [currentTime, activeClass?.ends_at, isClassLive, iframeUrl]);

  async function joinClassroom(id: number) {
    setJoinMessage("");
    setIsJoiningAttendance(true);
    const response = await fetch(STUDENT_API.classroomJoin(id), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    setIsJoiningAttendance(false);
    if (!response.ok) {
      setJoinMessage(payload?.message ?? "You cannot join this class yet.");
      return;
    }
    if (payload?.launch_url) {
      window.open(payload.launch_url, "_blank", "noopener,noreferrer");
    }
  }

  async function joinEmbeddedClassroom(classroomId: number) {
    if (!token) return;
    setJoinMessage("");
    setIsJoiningEmbeddedClass(true);

    try {
      const response = await fetch(STUDENT_API.classroomSdkSignature(classroomId), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ class_type: activeClass?.class_type ?? "classroom" }),
      });
      const payload = (await response.json()) as Partial<SdkSignaturePayload> & { message?: string };

      if (!response.ok || !payload.signature || !payload.sdk_key || !payload.meeting_number) {
        setJoinMessage(payload.message ?? "Could not initialize embedded class session.");
        return;
      }

      const url = new URL("/zoom-meeting.html", window.location.origin);
      url.searchParams.set("signature", payload.signature);
      url.searchParams.set("sdkKey", payload.sdk_key);
      url.searchParams.set("meetingNumber", payload.meeting_number);
      url.searchParams.set("passcode", payload.passcode ?? "");
      url.searchParams.set("userName", payload.user_name ?? studentName);
      url.searchParams.set("userEmail", payload.user_email ?? profile.email ?? "");

      setIframeUrl(url.toString());
    } catch {
      setJoinMessage("Failed to start live session. Please try again.");
    } finally {
      setIsJoiningEmbeddedClass(false);
    }
  }

  function leaveEmbeddedClassroom() {
    setIsClassLive(false);
    setIframeUrl(null);
    setJoinMessage("You left the classroom.");
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Classroom</h2>

      {joinMessage ? <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{joinMessage}</p> : null}

      {activeClass ? (
        <article className="overflow-hidden rounded-xl border border-white/15 bg-black/30">
          {activeClass.session_thumbnail_url ? (
            <div className="h-44 w-full overflow-hidden border-b border-white/10">
              <Image src={activeClass.session_thumbnail_url} alt={activeClass.title} width={1200} height={320} className="h-full w-full object-cover" unoptimized />
            </div>
          ) : null}

          <div className="p-4">
            <h3 className="text-lg font-semibold">{activeClass.title}</h3>
            <p className="mt-1 text-sm text-white/70">
              {formatLocalDateTime(activeClass.starts_at)}
              {isScheduledClass ? <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-200">Module Class</span> : null}
            </p>
            {!isScheduledClass && activeClass.meeting_url ? (
              <a href={activeClass.meeting_url} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Join Meeting
              </a>
            ) : null}

            {isScheduledClass && activeClass.meeting_password ? (
              <div className="mt-3">
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-blue-400 underline hover:text-blue-300">
                  {showPassword ? "Hide" : "Show"} meeting password
                </button>
                {showPassword ? <p className="mt-1 text-sm text-white/80 font-mono tracking-wider">{activeClass.meeting_password}</p> : null}
              </div>
            ) : null}

            {isScheduledClass && !activeClass.meeting_id ? (
              <p className="mt-3 text-sm text-white/60">No meeting set for this class.</p>
            ) : isScheduledClass && !canJoinClassroom(activeClass.starts_at, currentTime) ? (
              <>
                <p className="mt-3 text-sm text-white/75">Join opens 5 minutes before class starts.</p>
                <button type="button" disabled className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black opacity-40">Join Class</button>
              </>
            ) : isScheduledClass && !isClassLive ? (
              <>
                <p className="mt-3 text-sm text-white/75">Class is ready. Join directly inside your portal.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => joinEmbeddedClassroom(activeClass.id)}
                    disabled={isJoiningEmbeddedClass}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isJoiningEmbeddedClass ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Joining...</span> : "Join Class"}
                  </button>
                </div>
              </>
            ) : isScheduledClass && isClassLive ? (
              <>
                <p className="mt-3 text-sm text-emerald-300">Live now. You are in the embedded session.</p>
                <button type="button" onClick={leaveEmbeddedClassroom} className="mt-3 rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-100">
                  Leave Class
                </button>
              </>
            ) : !isClassActiveWindow(activeClass.starts_at, activeClass.ends_at, currentTime) ? (
              <>
                <p className="mt-3 text-sm text-white/75">Join opens 5 minutes before class starts.</p>
                <button type="button" disabled className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black opacity-40">
                  Join Class
                </button>
              </>
            ) : !isClassLive ? (
              <>
                <p className="mt-3 text-sm text-white/75">Class is ready. Join directly inside your portal.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => joinEmbeddedClassroom(activeClass.id)}
                    disabled={isJoiningEmbeddedClass}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isJoiningEmbeddedClass ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Joining...</span> : "Join Class"}
                  </button>
                  <button type="button" onClick={() => joinClassroom(activeClass.id)} disabled={isJoiningAttendance} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                    {isJoiningAttendance ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Marking...</span> : "Mark Attendance Only"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-emerald-300">Live now. You are in the embedded session.</p>
                <button type="button" onClick={leaveEmbeddedClassroom} className="mt-3 rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-100">
                  Leave Class
                </button>
              </>
            )}

            {iframeUrl ? (
              <>
                {/* CSS pseudo-fullscreen overlay — keeps iframe in DOM so Zoom re-layouts on resize */}
                <div
                  className={isFullscreen
                    ? "fixed inset-0 z-[9999] bg-black w-screen h-screen"
                    : "relative mt-4 rounded-lg border border-white/15 w-full overflow-hidden"
                  }
                  style={!isFullscreen ? { height: "78vh", minHeight: "650px" } : undefined}
                >
                  {/* Fullscreen toggle button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((f) => !f)}
                    title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                  >
                    {isFullscreen ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h4m-4 0v4m11-4l5-5m0 0h-4m4 0v4M9 15l-5 5m0 0h4m-4 0v-4m11 4l5-5m0 0v4m0-4h-4" />
                        </svg>
                        Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Fullscreen
                      </>
                    )}
                  </button>
                  <iframe
                    ref={iframeRef}
                    src={iframeUrl}
                    className="w-full h-full border-none"
                    allow="camera; microphone; display-capture; autoplay; fullscreen"
                    allowFullScreen
                    title="Live Session"
                  />
                </div>
              </>
            ) : !isClassLive && !isScheduledClass ? (
              <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 p-4 text-sm text-white/55">
                Embedded classroom will load here when you join.
              </div>
            ) : null}
          </div>
        </article>
      ) : upcomingClasses.length > 0 ? (
        <div className="space-y-3">
          {upcomingClasses.map((c) => {
            return (
              <article key={c.id} className="rounded-xl border border-white/15 bg-black/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{c.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{formatLocalDateTime(c.starts_at)}</p>
                    {c.class_type === "scheduled" ? <span className="mt-1 inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-200">Module Class</span> : null}
                    {c.meeting_password ? <p className="mt-2 text-xs text-white/50">Password set</p> : null}
                  </div>
                  {c.class_type === "scheduled" && c.meeting_url ? (
                    <a
                      href={c.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Join
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <article className="rounded-xl border border-white/15 bg-black/30 p-4">
          <h3 className="font-semibold">No upcoming classes scheduled</h3>
        </article>
      )}
    </div>
  );
}
