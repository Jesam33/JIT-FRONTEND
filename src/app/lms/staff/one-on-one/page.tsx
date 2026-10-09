"use client";

// A teacher's one-on-one students and their private sessions: see who they
// teach, schedule a session, move it, cancel it. Each change notifies the
// student (in the portal and by email). Private sessions also appear on the
// teacher's Timetable, which is where the Host button lives.
// Backend: StaffOneOnOneController.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { STAFF_API } from "@/lib/api";
import { apiFetchStaff, getStaffToken } from "@/lib/fetch-with-timeout";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

type Student = {
  id: number;
  name: string;
  email: string;
  course_id: number | null;
  course_title: string | null;
  teacher_name: string | null;
  next_session: { id: number; title: string; starts_at: string | null } | null;
  sessions_held: number;
  billing: { status: string | null; locked: boolean; paid_until: string | null } | null;
  // May this student book their own sessions from my availability?
  self_booking: boolean;
};

type Window = { weekday: number; start_time: string; end_time: string };
type TimeOff = { id: number; starts_on: string; ends_on: string; note: string | null };
type Availability = {
  windows: Window[];
  time_off: TimeOff[];
  timezone: string;
  rules: { min_notice_hours: number; cancel_window_hours: number; horizon_days: number };
};

// Monday first, as teachers think about their week; values match the
// backend's 0 = Sunday.
const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

type Session = {
  id: number;
  title: string;
  module_id: number;
  module_title: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  booked_by: "teacher" | "student";
  weekly: boolean;
  outcome: Outcome | null;
  // The academy owner decided this one; the teacher can't change it.
  outcome_by_owner: boolean;
  // The student reported "my teacher didn't come"; the owner is reviewing.
  reported: boolean;
};

type Outcome = "held" | "student_no_show" | "teacher_no_show";

const OUTCOME_LABELS: Record<Outcome, string> = {
  held: "Held",
  student_no_show: "Student didn't show",
  teacher_no_show: "I couldn't make it",
};

type ModuleOption = { id: number; title: string };

const DURATIONS = [30, 45, 60, 90, 120];

function fmt(iso: string | null | undefined): string {
  if (!iso) return "?";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "?"
    : d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// datetime-local value for an ISO time, in the browser's local time.
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minutesBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 60;
  const m = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  return m > 0 ? m : 60;
}

function BillingBadge({ billing }: { billing: Student["billing"] }) {
  if (!billing) return null;
  const [text, tone] = billing.locked
    ? ["Payment overdue · access paused", "bg-rose-500/15 text-rose-300"]
    : billing.status === "past_due"
      ? ["Payment overdue", "bg-amber-500/15 text-amber-300"]
      : billing.status === "active"
        ? ["Paid", "bg-emerald-500/15 text-emerald-300"]
        : ["Monthly billing stopped", "bg-white/10 text-white/60"];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>{text}</span>;
}

export default function StaffOneOnOnePage() {
  const token = getStaffToken();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [modules, setModules] = useState<Record<string, ModuleOption[]>>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOne);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || `Could not load your one-on-one students (HTTP ${res.status}).`);
        setStudents([]);
        return;
      }
      setError("");
      setStudents(json.students ?? []);
      setModules(json.modules ?? {});
    } catch {
      setError("Could not load your one-on-one students. Refresh to try again.");
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      await load();
    })();
  }, [token, load]);

  if (!students) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>One-on-one students</h1>
        <p className="mt-1 text-sm text-white/60">
          Students taking their course one-on-one with you. Set the times you&apos;re free and they can book themselves,
          or schedule sessions for them here; everyone is told each time. Host a session from your{" "}
          <Link href="/lms/staff/timetable" className="underline underline-offset-2">Timetable</Link>.
        </p>
      </div>

      <AvailabilityPanel />

      {error ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>
      ) : null}

      {students.length === 0 && !error ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center text-sm text-white/70">
          You don&apos;t have any one-on-one students yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {students.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/15 bg-black/30">
            <button
              type="button"
              onClick={() => setOpenId(openId === s.id ? null : s.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
              aria-expanded={openId === s.id}
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{s.name}</p>
                <p className="truncate text-xs text-white/55">
                  {s.course_title ?? "No course"} · {s.sessions_held} session{s.sessions_held === 1 ? "" : "s"} held
                  {s.teacher_name ? ` · Teacher: ${s.teacher_name}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BillingBadge billing={s.billing} />
                {!s.self_booking ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/60">Booking off</span>
                ) : null}
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/70">
                  {s.next_session ? `Next: ${fmt(s.next_session.starts_at)}` : "No session scheduled"}
                </span>
              </div>
            </button>
            {openId === s.id ? (
              <StudentSessions
                student={s}
                modules={(s.course_id && modules[String(s.course_id)]) || []}
                onChanged={load}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentSessions({
  student,
  modules,
  onChanged,
}: {
  student: Student;
  modules: ModuleOption[];
  onChanged: () => void;
}) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [moduleId, setModuleId] = useState<string>(modules[0] ? String(modules[0].id) : "");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editWhen, setEditWhen] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  // "Upcoming" is measured from when the panel opened (refreshed on reload).
  const [now] = useState(() => Date.now());

  const loadSessions = useCallback(async () => {
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneSessions(student.id));
      const json = await res.json().catch(() => ({}));
      setSessions(res.ok ? json.sessions ?? [] : []);
    } catch {
      setSessions([]);
    }
  }, [student.id]);

  useEffect(() => {
    (async () => {
      await loadSessions();
    })();
  }, [loadSessions]);

  const after = async (res: Response, okText: string) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstError = json?.errors ? (Object.values(json.errors)[0] as string[] | undefined)?.[0] : undefined;
      setMsg({ kind: "err", text: firstError || json?.message || `Something went wrong (HTTP ${res.status}).` });
      return false;
    }
    setMsg({ kind: "ok", text: okText });
    await loadSessions();
    onChanged();
    return true;
  };

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !when) {
      setMsg({ kind: "err", text: "Pick a module and a date and time." });
      return;
    }
    const start = new Date(when);
    const end = new Date(start.getTime() + duration * 60000);
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneSessions(student.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module_id: Number(moduleId), starts_at: start.toISOString(), ends_at: end.toISOString() }),
      });
      if (await after(res, `Session scheduled. ${student.name} has been told.`)) setWhen("");
    } finally {
      setSaving(false);
    }
  };

  const reschedule = async (s: Session) => {
    if (!editWhen) return;
    const start = new Date(editWhen);
    const end = new Date(start.getTime() + minutesBetween(s.starts_at, s.ends_at) * 60000);
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneSession(s.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ starts_at: start.toISOString(), ends_at: end.toISOString() }),
      });
      if (await after(res, `Session moved. ${student.name} has been told.`)) setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id: number) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneSessionCancel(id), {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      await after(res, `Session cancelled. ${student.name} has been told.`);
    } finally {
      setSaving(false);
      setConfirmCancel(null);
    }
  };

  const markOutcome = async (s: Session, outcome: Outcome) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneSessionOutcome(s.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ outcome }),
      });
      await after(
        res,
        outcome === "teacher_no_show"
          ? `Recorded. ${student.name} has been told it won't count toward their sessions.`
          : outcome === "student_no_show"
            ? `Recorded as missed. It counts as one of ${student.name}'s sessions.`
            : "Recorded as held.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSelfBooking = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneSelfBooking(student.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ enabled: !student.self_booking }),
      });
      await after(
        res,
        student.self_booking
          ? `${student.name} can no longer book; you schedule their sessions.`
          : `${student.name} can now book from your available times.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const upcoming = (sessions ?? []).filter((s) => s.status !== "cancelled" && s.starts_at && new Date(s.starts_at).getTime() > now).reverse();
  const past = (sessions ?? []).filter((s) => !upcoming.includes(s));
  const inputClass = "rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white";

  return (
    <div className="space-y-5 border-t border-white/10 px-5 py-4">
      {msg ? (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"
          }`}
        >
          {msg.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
        <p className="text-sm text-white/70">
          {student.self_booking
            ? "This student can book their own sessions from your available times."
            : "Booking is off for this student. You schedule their sessions."}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={student.self_booking}
          aria-label="Let this student book their own sessions"
          disabled={saving}
          onClick={toggleSelfBooking}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${student.self_booking ? "bg-emerald-500" : "bg-white/20"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${student.self_booking ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <form onSubmit={schedule} className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Schedule a session</p>
        {modules.length === 0 ? (
          <p className="text-sm text-white/60">This course has no modules yet. Add modules first.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Module
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={inputClass}>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Date and time
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Length
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Schedule"}
            </button>
          </div>
        )}
      </form>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Upcoming</p>
        {sessions === null ? (
          <p className="text-sm text-white/50">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-white/50">Nothing scheduled yet.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-white">{fmt(s.starts_at)}</p>
                  <p className="truncate text-xs text-white/50">
                    {s.module_title ?? s.title}
                    {s.booked_by === "student" ? " · booked by student" : ""}
                    {s.weekly ? " · weekly" : ""}
                  </p>
                </div>
                {editingId === s.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="datetime-local" value={editWhen} onChange={(e) => setEditWhen(e.target.value)} className={inputClass} />
                    <button type="button" disabled={saving} onClick={() => reschedule(s)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70">
                      Back
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(s.id);
                        setEditWhen(toLocalInput(s.starts_at));
                      }}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:border-white/40"
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(s.id)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-300/80 hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Past and cancelled</p>
          <p className="mb-2 text-xs text-white/45">
            Record what happened after each session. A session you couldn&apos;t make doesn&apos;t count toward the
            student&apos;s sessions; one they missed does.
          </p>
          <ul className="space-y-1.5">
            {past.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
                <span>
                  {fmt(s.starts_at)} · {s.module_title ?? s.title}
                  {s.reported ? <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">Student reported a no-show</span> : null}
                </span>
                {s.status === "cancelled" ? (
                  <span>Cancelled</span>
                ) : s.outcome_by_owner ? (
                  <span>{s.outcome ? OUTCOME_LABELS[s.outcome] : "Held"} · set by the academy</span>
                ) : (
                  <select
                    value={s.outcome ?? ""}
                    disabled={saving}
                    onChange={(e) => e.target.value && markOutcome(s, e.target.value as Outcome)}
                    className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white"
                    aria-label="What happened at this session"
                  >
                    <option value="" disabled>Not marked (counts as held)</option>
                    {(Object.keys(OUTCOME_LABELS) as Outcome[]).map((o) => (
                      <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Cancel this session?"
        message={`${student.name} will be told the session is cancelled.`}
        confirmLabel="Cancel session"
        cancelLabel="Keep it"
        onConfirm={() => confirmCancel !== null && cancel(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}

// My weekly open times (students book from these) and days off. Times are in
// the academy's timezone, which the backend reports.
function AvailabilityPanel() {
  const [data, setData] = useState<Availability | null>(null);
  const [windows, setWindows] = useState<Window[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [offFrom, setOffFrom] = useState("");
  const [offTo, setOffTo] = useState("");
  const [offNote, setOffNote] = useState("");

  const apply = (json: Availability) => {
    setData(json);
    setWindows(json.windows ?? []);
    setDirty(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetchStaff(STAFF_API.oneOnOneAvailability);
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          apply(json as Availability);
          // Open straight away until the teacher has set any times.
          setOpen(((json as Availability).windows ?? []).length === 0);
        }
      } catch {
        // The panel just stays hidden; the rest of the page still works.
      }
    })();
  }, []);

  const result = async (res: Response, okText: string) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstError = json?.errors ? (Object.values(json.errors)[0] as string[] | undefined)?.[0] : undefined;
      setMsg({ kind: "err", text: firstError || json?.message || `Something went wrong (HTTP ${res.status}).` });
      return;
    }
    apply(json as Availability);
    setMsg({ kind: "ok", text: okText });
  };

  const saveWindows = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneAvailability, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ windows }),
      });
      await result(res, "Your available times are saved. Students can book them now.");
    } finally {
      setSaving(false);
    }
  };

  const addTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offFrom) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneTimeOff, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ starts_on: offFrom, ends_on: offTo || offFrom, note: offNote || null }),
      });
      await result(res, "Days off saved. No bookings will be offered on them.");
      if (res.ok) {
        setOffFrom("");
        setOffTo("");
        setOffNote("");
      }
    } finally {
      setSaving(false);
    }
  };

  const removeTimeOff = async (id: number) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(STAFF_API.oneOnOneTimeOffDelete(id), { method: "DELETE", headers: { Accept: "application/json" } });
      await result(res, "Days off removed.");
    } finally {
      setSaving(false);
    }
  };

  const update = (index: number, patch: Partial<Window>) => {
    setWindows((ws) => ws.map((w, i) => (i === index ? { ...w, ...patch } : w)));
    setDirty(true);
  };
  const remove = (index: number) => {
    setWindows((ws) => ws.filter((_, i) => i !== index));
    setDirty(true);
  };
  const add = (weekday: number) => {
    setWindows((ws) => [...ws, { weekday, start_time: "09:00", end_time: "12:00" }]);
    setDirty(true);
  };

  if (!data) return null;

  const inputClass = "rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white";
  const hours = windows.length;
  const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div className="rounded-2xl border border-white/15 bg-black/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-base font-semibold text-white">My available times</p>
          <p className="text-xs text-white/55">
            {hours === 0 ? "Not set yet. Students can't book you until you add some times." : `${hours} time window${hours === 1 ? "" : "s"} a week`}
          </p>
        </div>
        <span className="text-xs text-white/60">{open ? "Hide" : "Edit"}</span>
      </button>

      {open ? (
        <div className="space-y-5 border-t border-white/10 px-5 py-4">
          {msg ? (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"
              }`}
            >
              {msg.text}
            </div>
          ) : null}

          <p className="text-xs text-white/55">
            Times are in your academy&apos;s time ({data.timezone.replace("_", " ")}). Students see them in their own local time.
            Bookings need {data.rules.min_notice_hours} hours&apos; notice and are offered up to {data.rules.horizon_days} days ahead.
          </p>

          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const rows = windows.map((w, i) => ({ w, i })).filter(({ w }) => w.weekday === day.value);
              return (
                <div key={day.value} className="flex flex-wrap items-start gap-3 border-b border-white/5 pb-2 last:border-b-0">
                  <span className="w-24 pt-1.5 text-sm text-white/80">{day.label}</span>
                  <div className="flex flex-1 flex-col gap-2">
                    {rows.length === 0 ? <span className="pt-1.5 text-sm text-white/35">Not available</span> : null}
                    {rows.map(({ w, i }) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <input type="time" step={900} value={w.start_time} onChange={(e) => update(i, { start_time: e.target.value })} className={inputClass} aria-label={`${day.label} from`} />
                        <span className="text-xs text-white/50">to</span>
                        <input type="time" step={900} value={w.end_time} onChange={(e) => update(i, { end_time: e.target.value })} className={inputClass} aria-label={`${day.label} until`} />
                        <button type="button" onClick={() => remove(i)} className="rounded-lg px-2 py-1 text-xs text-white/50 hover:text-red-300" aria-label="Remove this time">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => add(day.value)} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:border-white/40">
                    Add time
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={saving || !dirty}
            onClick={saveWindows}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save available times"}
          </button>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Days off</p>
            <form onSubmit={addTimeOff} className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-white/60">
                From
                <input type="date" value={offFrom} onChange={(e) => setOffFrom(e.target.value)} className={inputClass} required />
              </label>
              <label className="flex flex-col gap-1 text-xs text-white/60">
                Until
                <input type="date" value={offTo} min={offFrom || undefined} onChange={(e) => setOffTo(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-white/60">
                Note (optional)
                <input type="text" maxLength={120} value={offNote} onChange={(e) => setOffNote(e.target.value)} className={inputClass} placeholder="e.g. Travelling" />
              </label>
              <button type="submit" disabled={saving || !offFrom} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:border-white/40 disabled:opacity-40">
                Add days off
              </button>
            </form>
            {data.time_off.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {data.time_off.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
                    <span>
                      {t.starts_on === t.ends_on ? fmtDate(t.starts_on) : `${fmtDate(t.starts_on)} to ${fmtDate(t.ends_on)}`}
                      {t.note ? ` · ${t.note}` : ""}
                    </span>
                    <button type="button" disabled={saving} onClick={() => removeTimeOff(t.id)} className="text-xs text-white/50 hover:text-red-300">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-white/45">Sessions already booked on those days stay; move or cancel them below if needed.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
