"use client";

// The owner's view of one-on-one teaching for a month: totals, per teacher,
// per student, and every session, so they can check teachers deliver what
// students paid for. Students' "my teacher didn't come" reports show here and
// the owner records what happened (their decision overrides the teacher's).
// Backend: OwnerOneOnOneController.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, maybeUpgrade } from "@/lib/owner-client";
import { formatPrice } from "@/lib/currency";
import { useAcademyCurrency } from "@/lib/academy-currency";
import LoadingSpinner from "@/components/LoadingSpinner";

type Outcome = "held" | "student_no_show" | "teacher_no_show";

type Counts = {
  sessions: number;
  upcoming: number;
  held: number;
  cancelled: number;
  student_no_shows: number;
  teacher_no_shows: number;
  unmarked: number;
};

type Overview = {
  month: string;
  month_label: string;
  timezone: string;
  totals: Counts & { reports_pending: number; students: number; extra_revenue: number };
  teachers: (Counts & { id: number; name: string; students: number })[];
  students: (Counts & {
    id: number;
    name: string;
    teacher_name: string | null;
    course_title: string | null;
    limit: number | null;
    extra: number;
    used: number;
    period: "month" | "course";
  })[];
  sessions: {
    id: number;
    starts_at: string;
    student_name: string | null;
    teacher_name: string | null;
    module_title: string;
    status: string;
    booked_by: "teacher" | "student";
    outcome: Outcome | null;
    outcome_by: "teacher" | "owner" | null;
    reported: boolean;
    started: boolean;
  }[];
};

const OUTCOME_LABELS: Record<Outcome, string> = {
  held: "Held",
  student_no_show: "Student didn't show",
  teacher_no_show: "Teacher didn't show",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "warn" | "bad" }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "bad" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default function OwnerOneOnOnePage() {
  const router = useRouter();
  const currency = useAcademyCurrency();
  const [month, setMonth] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "attention">("all");

  const load = useCallback(async (m: string) => {
    try {
      const res = await fetch(OWNER_API.oneOnOneOverview(m || undefined), { headers: ownerAuthHeaders() });
      if (await maybeUpgrade(res)) return;
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load one-on-one activity (HTTP ${res.status}).`);
        return;
      }
      const json = (await res.json()) as Overview;
      setError("");
      setData(json);
      setMonth(json.month);
    } catch {
      setError("Could not load one-on-one activity. Refresh to try again.");
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      await load("");
    })();
  }, [load]);

  const setOutcome = async (sessionId: number, outcome: Outcome) => {
    setSavingId(sessionId);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.oneOnOneOutcome(sessionId), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ outcome }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const first = json?.errors ? (Object.values(json.errors)[0] as string[] | undefined)?.[0] : undefined;
        setMsg({ kind: "err", text: first || json?.message || "Could not save that." });
      } else {
        setMsg({
          kind: "ok",
          text: outcome === "teacher_no_show"
            ? "Recorded. The student has been told it won't count toward their sessions."
            : "Recorded. The student and teacher have been told.",
        });
        await load(month);
      }
    } catch {
      setMsg({ kind: "err", text: "Could not save that. Please try again." });
    }
    setSavingId(null);
  };

  if (!data) {
    return error ? (
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>
    ) : (
      <LoadingSpinner />
    );
  }

  const t = data.totals;
  const sessions = filter === "attention"
    ? data.sessions.filter((s) => s.reported || (s.started && s.status !== "cancelled" && (s.outcome === null || s.outcome !== "held")))
    : data.sessions;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>One-on-one</h1>
          <p className="mt-1 text-sm text-white/60">
            Every private session in your academy: who taught, who came, and anything that needs a look.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(shiftMonth(month, -1))} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:border-white/40" aria-label="Previous month">
            ‹
          </button>
          <span className="min-w-[130px] text-center text-sm font-semibold text-white">{data.month_label}</span>
          <button type="button" onClick={() => load(shiftMonth(month, 1))} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:border-white/40" aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}
      {msg ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"}`}>
          {msg.text}
        </div>
      ) : null}

      {t.reports_pending > 0 ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {t.reports_pending} student report{t.reports_pending === 1 ? "" : "s"} of a missed session to check. Find {t.reports_pending === 1 ? "it" : "them"} below and record what happened.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sessions" value={t.sessions} />
        <Stat label="Held" value={t.held} />
        <Stat label="Upcoming" value={t.upcoming} />
        <Stat label="Cancelled" value={t.cancelled} />
        <Stat label="Teacher no-shows" value={t.teacher_no_shows} tone={t.teacher_no_shows > 0 ? "bad" : undefined} />
        <Stat label="Student no-shows" value={t.student_no_shows} tone={t.student_no_shows > 0 ? "warn" : undefined} />
        <Stat label="Not marked yet" value={t.unmarked} />
        <Stat label="Extra sessions sold" value={formatPrice(t.extra_revenue, currency)} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">By teacher</h2>
        {data.teachers.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-sm text-white/60">No one-on-one teachers yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/15 bg-black/30">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-3 py-3 font-medium">Students</th>
                  <th className="px-3 py-3 font-medium">Held</th>
                  <th className="px-3 py-3 font-medium">Upcoming</th>
                  <th className="px-3 py-3 font-medium">Cancelled</th>
                  <th className="px-3 py-3 font-medium">Missed by teacher</th>
                  <th className="px-3 py-3 font-medium">Missed by student</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-white/80">
                    <td className="px-4 py-3 text-white">{row.name}</td>
                    <td className="px-3 py-3">{row.students}</td>
                    <td className="px-3 py-3">{row.held}</td>
                    <td className="px-3 py-3">{row.upcoming}</td>
                    <td className="px-3 py-3">{row.cancelled}</td>
                    <td className={`px-3 py-3 ${row.teacher_no_shows > 0 ? "text-rose-300" : ""}`}>{row.teacher_no_shows}</td>
                    <td className="px-3 py-3">{row.student_no_shows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">By student</h2>
        {data.students.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-sm text-white/60">No one-on-one students yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/15 bg-black/30">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-3 py-3 font-medium">Teacher</th>
                  <th className="px-3 py-3 font-medium">Sessions used</th>
                  <th className="px-3 py-3 font-medium">Held</th>
                  <th className="px-3 py-3 font-medium">Upcoming</th>
                  <th className="px-3 py-3 font-medium">Missed (teacher / student)</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-white/80">
                    <td className="px-4 py-3">
                      <p className="text-white">{row.name}</p>
                      <p className="text-xs text-white/45">{row.course_title ?? "No course"}</p>
                    </td>
                    <td className="px-3 py-3">{row.teacher_name ?? <span className="text-amber-300">Needs a teacher</span>}</td>
                    <td className="px-3 py-3">
                      {row.limit !== null ? `${row.used} of ${row.limit}` : `${row.used} (no limit)`}
                      {row.extra > 0 ? <span className="text-xs text-white/45"> · {row.extra} extra</span> : null}
                      <p className="text-xs text-white/40">{row.period === "month" ? "this month" : "whole course"}</p>
                    </td>
                    <td className="px-3 py-3">{row.held}</td>
                    <td className="px-3 py-3">{row.upcoming}</td>
                    <td className="px-3 py-3">{row.teacher_no_shows} / {row.student_no_shows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Sessions</h2>
          <div className="flex gap-2">
            {(["all", "attention"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs transition ${filter === f ? "border-white bg-white text-black" : "border-white/20 text-white/70 hover:border-white/40"}`}
              >
                {f === "all" ? "All" : "Needs a look"}
              </button>
            ))}
          </div>
        </div>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-sm text-white/60">
            {filter === "attention" ? "Nothing needs a look this month." : "No one-on-one sessions this month."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
            {sessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="text-white">
                    {fmt(s.starts_at)} · {s.student_name ?? "Student"} with {s.teacher_name ?? "teacher"}
                  </p>
                  <p className="text-xs text-white/50">
                    {s.module_title}
                    {s.booked_by === "student" ? " · booked by student" : ""}
                    {s.outcome_by === "owner" ? " · decided by you" : ""}
                    {s.reported ? (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">Student says the teacher didn&apos;t come</span>
                    ) : null}
                  </p>
                </div>
                {s.status === "cancelled" ? (
                  <span className="text-xs text-white/45">Cancelled</span>
                ) : !s.started ? (
                  <span className="text-xs text-white/45">Upcoming</span>
                ) : (
                  <select
                    value={s.outcome ?? ""}
                    disabled={savingId === s.id}
                    onChange={(e) => e.target.value && setOutcome(s.id, e.target.value as Outcome)}
                    className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white"
                    aria-label="What happened at this session"
                  >
                    <option value="" disabled>Not marked (counts as held)</option>
                    {(Object.keys(OUTCOME_LABELS) as Outcome[]).map((o) => (
                      <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-white/45">
          A session the teacher missed doesn&apos;t count toward the student&apos;s sessions; one the student missed does.
          Times are shown in your local time.
        </p>
      </section>
    </div>
  );
}
