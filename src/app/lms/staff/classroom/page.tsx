"use client";

import { useCallback, useEffect, useState } from "react";

import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";
import { isClassEnded } from "../../../../lib/lms-utils";
import LoadingSpinner from "../../../../components/LoadingSpinner";

function toLocalDatetimeString(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Classroom = {
  id: number;
  course_id: number;
  teacher_id: number | null;
  title: string;
  description: string | null;
  meeting_url: string | null;
  meeting_id: string | null;
  meeting_password: string | null;
  session_thumbnail_url: string | null;
  recording_url: string | null;
  starts_at: string;
  ends_at: string | null;
  course?: { id: number; title: string };
  teacher?: { id: number; first_name: string; last_name: string };
};

type Course = { id: number; title: string };

const emptyForm = {
  course_id: 0,
  teacher_id: "",
  title: "",
  description: "",
  meeting_url: "",
  meeting_id: "",
  meeting_password: "",
  session_thumbnail_url: "",
  starts_at: "",
  ends_at: "",
};

export default function StaffClassroomPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [markingEndedId, setMarkingEndedId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [cls, crs, sched] = await Promise.all([
        apiFetchStaff(STAFF_API.classrooms).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
        // Tenant + instructor scoped (the teacher's assigned courses), NOT the
        // public /courses list — a bare fetch there carries no token/tenant, so
        // the backend falls back to the primary institute and leaks its courses
        // into another tenant's dropdown. Mirrors the Modules page.
        apiFetchStaff(STAFF_API.assignedCourses).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
        apiFetchStaff(STAFF_API.scheduledClasses).then((r) => r.json()),
      ]);
      setClassrooms(Array.isArray(cls) ? cls : []);
      setCourses(Array.isArray(crs) ? crs : []);
      setScheduledClasses(Array.isArray(sched) ? sched : []);
    } catch { /* ignore */ }
    setLoadingScheduled(false);
  }, [token]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (c: Classroom) => {
    setForm({
      course_id: c.course_id,
      teacher_id: c.teacher_id?.toString() ?? "",
      title: c.title,
      description: c.description ?? "",
      meeting_url: c.meeting_url ?? "",
      meeting_id: c.meeting_id ?? "",
      meeting_password: c.meeting_password ?? "",
      session_thumbnail_url: c.session_thumbnail_url ?? "",
      starts_at: toLocalDatetimeString(c.starts_at),
      ends_at: c.ends_at ? toLocalDatetimeString(c.ends_at) : "",
    });
    setEditingId(c.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this classroom?')) return;
    setDeletingId(id);
    const res = await apiFetchStaff(STAFF_API.classroom(id), {
      method: 'DELETE',
    });
    if (res.ok) {
      setClassrooms(classrooms.filter((c) => c.id !== id));
    }
    setDeletingId(null);
  };

  const handleMarkEnded = async (id: number) => {
    setMarkingEndedId(id);
    setMessage("");
    const now = new Date().toISOString();
    const res = await apiFetchStaff(STAFF_API.classroom(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ends_at: now }),
    });
    setMarkingEndedId(null);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload?.message ?? "Failed to mark class as ended.");
      return;
    }
    setMessage("Class marked as ended.");
    setCurrentTime(Date.now());
    await loadData();
  };

  // Host the live class as moderator. The tab is opened synchronously (inside the
  // click gesture) so popup blockers don't kill it, then redirected to the JaaS
  // room once the moderator token is minted. Handles both class kinds: "scheduled"
  // (per-module LmsScheduledClass) and "classroom" (per-course LmsClassroom).
  const hostClass = async (id: number, classType: string) => {
    setMessage("");
    const win = window.open("about:blank", "_blank");
    try {
      const res = await apiFetchStaff(STAFF_API.classroomMeetingToken(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_type: classType }),
      });
      const p = await res.json();
      if (!res.ok || !p.jwt || !p.room || !p.domain || !p.app_id) {
        if (win) win.close();
        setMessage(p?.message ?? "Could not start the live class.");
        return;
      }
      const url = `https://${p.domain}/${p.app_id}/${p.room}?jwt=${encodeURIComponent(p.jwt)}`;
      if (win) win.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      if (win) win.close();
      setMessage("Could not start the live class.");
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setMessage("");

    const body: Record<string, unknown> = {
      course_id: form.course_id,
      title: form.title,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      meeting_url: form.meeting_url || null,
      meeting_id: form.meeting_id || null,
      meeting_password: form.meeting_password || null,
      session_thumbnail_url: form.session_thumbnail_url || null,
      description: form.description || null,
    };
    if (form.teacher_id) body.teacher_id = Number(form.teacher_id);

    const url = editingId ? STAFF_API.classroom(editingId) : STAFF_API.classrooms;
    const method = editingId ? "PUT" : "POST";

    const res = await apiFetchStaff(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(payload?.message ?? "Failed to save classroom.");
      return;
    }

    setMessage(editingId ? "Classroom updated." : "Classroom created.");
    resetForm();

    const refreshed = await apiFetchStaff(STAFF_API.classrooms).then((r) => r.json());
    setClassrooms(Array.isArray(refreshed) ? refreshed : []);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Classrooms</h2>

      {message ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{message}</p>
      ) : null}

      {/* Live Now Scheduled Classes */}
      {(() => {
        const live = scheduledClasses.filter((c) => c.status !== "cancelled" && new Date(c.starts_at).getTime() <= currentTime && !isClassEnded(c.starts_at, c.ends_at, currentTime));
        return live.length > 0 ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
            <h3 className="font-semibold text-emerald-200">Live Now</h3>
            <div className="mt-3 space-y-2">
              {live.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-black/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-white/60">{new Date(c.starts_at).toLocaleString()}{c.module ? ` - ${c.module.title}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => hostClass(c.id, "scheduled")} className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500">Host</button>
                    <span className="rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-200">Live</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Upcoming Scheduled Classes */}
      {(() => {
        const upcoming = scheduledClasses.filter((c) => c.status === "scheduled" && new Date(c.starts_at).getTime() > currentTime);
        return upcoming.length > 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="font-semibold text-emerald-200">Upcoming Module Classes</h3>
            <div className="mt-3 space-y-2">
              {upcoming.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-emerald-500/15 bg-black/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-white/60">{new Date(c.starts_at).toLocaleString()}{c.module ? ` - ${c.module.title}` : ""}</p>
                  </div>
                  <button onClick={() => hostClass(c.id, "scheduled")} className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500">Host</button>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}
      {!loadingScheduled && scheduledClasses.filter((c) => c.status !== "cancelled").length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm text-white/60">No scheduled classes from modules.</p>
        </div>
      ) : null}

      {/* Form */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
        <h3 className="mb-4 font-semibold">{editingId ? "Edit Classroom" : "Create Classroom"}</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <select
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: Number(e.target.value) })}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          >
            <option value={0}>Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />

          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />

          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            placeholder="Ends at (optional)"
          />

          <input
            type="url"
            placeholder="Thumbnail URL (optional)"
            value={form.session_thumbnail_url}
            onChange={(e) => setForm({ ...form, session_thumbnail_url: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.course_id || !form.title || !form.starts_at}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {editingId ? "Updating..." : "Creating..."}
              </span>
            ) : editingId ? (
              "Update Classroom"
            ) : (
              "Create Classroom"
            )}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white">
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {classrooms.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/15 bg-black/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 text-xs text-white/60">{c.course?.title ?? "Unknown course"}</p>
                <p className="mt-1 text-xs text-white/60">{new Date(c.starts_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {isClassEnded(c.starts_at, c.ends_at, currentTime) ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">Ended</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => hostClass(c.id, "classroom")}
                      className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                    >
                      Host
                    </button>
                    <button type="button" onClick={() => handleMarkEnded(c.id)} disabled={markingEndedId === c.id} className="rounded-full border border-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 disabled:opacity-40">
                      {markingEndedId === c.id ? "Marking..." : "Mark Ended"}
                    </button>
                    <button type="button" onClick={() => startEdit(c)} className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                      {deletingId === c.id ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {!classrooms.length ? (
          <div className="rounded-xl border border-white/15 bg-black/30 p-4 text-sm text-white/75">No classrooms yet.</div>
        ) : null}
      </div>
    </div>
  );
}
