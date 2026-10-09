"use client";

// One-on-one self-booking: the open times in my teacher's week, pick one and
// a module, book it (or the same time every week). My upcoming sessions below,
// cancellable up to the academy's cancellation window; recent sessions with a
// "my teacher didn't come" report; extra sessions to buy once my allowance is
// used (Paystack returns here with ?reference=, verified on arrival).
// Times show in the viewer's own timezone.
// Backend: StudentOneOnOneController + App\Services\OneOnOneBooking.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { STUDENT_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";
import { formatPrice } from "@/lib/currency";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";

type Slot = { starts_at: string; ends_at: string };

type Upcoming = {
  id: number;
  title: string;
  module_title: string | null;
  starts_at: string;
  ends_at: string | null;
  booked_by: "teacher" | "student";
  weekly: boolean;
  can_cancel: boolean;
};

type Recent = {
  id: number;
  module_title: string;
  starts_at: string;
  outcome: "held" | "student_no_show" | "teacher_no_show" | null;
  reported: boolean;
  can_report: boolean;
};

type BookingData = {
  teacher_name: string | null;
  blocked_reason: string | null;
  slots: Slot[];
  session_minutes: number;
  allowance: { limit: number | null; included: number | null; extra: number; used: number; remaining: number | null; period: "month" | "course" };
  extras: { price: number; currency: string; max: number } | null;
  modules: { id: number; title: string }[];
  upcoming: Upcoming[];
  recent: Recent[];
  rules: { min_notice_hours: number; cancel_window_hours: number; horizon_days: number; repeat_max_weeks: number };
};

type Notice = { kind: "ok" | "err"; text: string };

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

function firstError(j: { message?: string; errors?: Record<string, string[]> }, fallback: string): string {
  const fromErrors = j.errors ? Object.values(j.errors)[0]?.[0] : undefined;
  return fromErrors ?? j.message ?? fallback;
}

function outcomeLabel(r: Recent): string {
  if (r.outcome === "teacher_no_show") return "Teacher missed it · not counted";
  if (r.outcome === "student_no_show") return "Marked as missed";
  if (r.reported) return "Reported · academy reviewing";
  return "Held";
}

// useSearchParams needs a Suspense boundary for the static build.
export default function BookSessionPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookSession />
    </Suspense>
  );
}

function BookSession() {
  const params = useSearchParams();
  const reference = params?.get("reference") ?? "";

  const [data, setData] = useState<BookingData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [day, setDay] = useState<string>("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [moduleId, setModuleId] = useState<string>("");
  const [weeks, setWeeks] = useState(1);
  const [extraCount, setExtraCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmBook, setConfirmBook] = useState(false);
  const [cancelling, setCancelling] = useState<Upcoming | null>(null);
  const [reporting, setReporting] = useState<Recent | null>(null);
  const verifiedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(STUDENT_API.oneOnOneBooking);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLoadError(j.message ?? "Couldn't load booking. Refresh the page to try again.");
        return;
      }
      setLoadError("");
      setData(j as BookingData);
    } catch {
      setLoadError("Couldn't load booking. Refresh the page to try again.");
    }
  }, []);

  // First load; back from Paystack, confirm the extra-sessions payment first.
  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    (async () => {
      if (reference) {
        try {
          const r = await apiFetch(STUDENT_API.oneOnOneExtrasVerify(reference));
          const j = await r.json().catch(() => ({}));
          setNotice({
            kind: r.ok && (j.status === "success" || j.status === "review") ? "ok" : "err",
            text: j.message ?? "We could not confirm that payment yet. Refresh in a moment.",
          });
        } catch {
          setNotice({ kind: "err", text: "We could not confirm that payment yet. Refresh in a moment." });
        }
        // Drop ?reference so a refresh doesn't re-verify.
        window.history.replaceState(null, "", window.location.pathname);
      }
      await load();
    })();
  }, [reference, load]);

  // Slots grouped by the viewer's local day, in order.
  const days = useMemo(() => {
    const groups: { key: string; label: string; slots: Slot[] }[] = [];
    for (const s of data?.slots ?? []) {
      const key = dayKey(s.starts_at);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.slots.push(s);
      else groups.push({ key, label: fmtDay(s.starts_at), slots: [s] });
    }
    return groups;
  }, [data]);

  const activeDay = days.find((d) => d.key === day) ?? days[0];

  const post = async (url: string, body?: unknown) => {
    const r = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, j };
  };

  const book = async () => {
    if (!slot || !moduleId) return;
    setConfirmBook(false);
    setBusy(true);
    setNotice(null);
    try {
      const { ok, j } = await post(STUDENT_API.oneOnOneBooking, { starts_at: slot.starts_at, module_id: Number(moduleId), repeat_weeks: weeks });
      if (ok) {
        const skipped = (j.skipped ?? []) as { starts_at: string; reason: string }[];
        const bookedCount = (j.booked ?? []).length as number;
        let text = weeks > 1
          ? `Booked ${bookedCount} weekly session${bookedCount === 1 ? "" : "s"}, starting ${fmtFull(slot.starts_at)}.`
          : `Booked for ${fmtFull(slot.starts_at)}.`;
        if (skipped.length > 0) {
          text += ` Not booked: ${skipped.map((s) => `${fmtDay(s.starts_at)} (${s.reason.replace(/\.$/, "")})`).join("; ")}.`;
        }
        setNotice({ kind: "ok", text: `${text} Your teacher has been told.` });
        setSlot(null);
        setWeeks(1);
      } else {
        setNotice({ kind: "err", text: firstError(j, "Couldn't book that time. Please try another.") });
      }
    } catch {
      setNotice({ kind: "err", text: "Couldn't book that time. Please try again." });
    }
    setBusy(false);
    await load();
  };

  const cancel = async () => {
    const session = cancelling;
    setCancelling(null);
    if (!session) return;
    setBusy(true);
    setNotice(null);
    try {
      const { ok, j } = await post(STUDENT_API.oneOnOneBookingCancel(session.id));
      setNotice(ok ? { kind: "ok", text: "Session cancelled. Your teacher has been told." } : { kind: "err", text: firstError(j, "Couldn't cancel that session.") });
    } catch {
      setNotice({ kind: "err", text: "Couldn't cancel that session. Please try again." });
    }
    setBusy(false);
    await load();
  };

  const report = async () => {
    const session = reporting;
    setReporting(null);
    if (!session) return;
    setBusy(true);
    setNotice(null);
    try {
      const { ok, j } = await post(STUDENT_API.oneOnOneReportNoShow(session.id));
      setNotice(ok
        ? { kind: "ok", text: "Thanks for telling us. Your academy will check and let you know. If your teacher missed it, it won't count toward your sessions." }
        : { kind: "err", text: firstError(j, "Couldn't send that report.") });
    } catch {
      setNotice({ kind: "err", text: "Couldn't send that report. Please try again." });
    }
    setBusy(false);
    await load();
  };

  const buyExtras = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const { ok, j } = await post(STUDENT_API.oneOnOneExtras, { sessions: extraCount });
      if (ok && j.authorization_url) {
        window.location.href = j.authorization_url;
        return;
      }
      setNotice({ kind: "err", text: firstError(j, "Could not start the payment. Please try again.") });
    } catch {
      setNotice({ kind: "err", text: "Could not start the payment. Please try again." });
    }
    setBusy(false);
  };

  if (loadError && !data) {
    return (
      <div className="space-y-6 pb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Book a session</h1>
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{loadError}</div>
      </div>
    );
  }
  if (!data) return <LoadingSpinner />;

  const { allowance, rules, extras } = data;
  const periodWord = allowance.period === "month" ? "this month" : "in your course";
  const allowanceLine = allowance.limit !== null
    ? `${allowance.remaining} of ${allowance.limit} sessions left ${periodWord}${allowance.extra > 0 ? ` (includes ${allowance.extra} extra)` : ""}.`
    : null;
  const usedUp = allowance.limit !== null && allowance.remaining === 0;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Book a session</h1>
        <p className="mt-1 text-sm text-white/60">
          {data.teacher_name ? `One-on-one with ${data.teacher_name}. ` : ""}
          Sessions are {data.session_minutes} minutes.{allowanceLine ? ` ${allowanceLine}` : ""}
        </p>
      </div>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {data.blocked_reason ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-sm text-white/70">{data.blocked_reason}</div>
      ) : days.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-sm text-white/70">
          {usedUp
            ? `You've used all your sessions ${allowance.period === "month" ? "for this month" : "for your course"}.${extras ? " You can buy extra sessions below." : ""}`
            : `No open times in the next ${rules.horizon_days} days. Your teacher may add more soon, or message them to arrange a time.`}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <p className="mb-3 text-sm font-semibold text-white">1. Pick a day and time</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {days.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => { setDay(d.key); setSlot(null); }}
                className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition ${
                  activeDay?.key === d.key ? "border-white bg-white text-black" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {activeDay?.slots.map((s) => (
              <button
                key={s.starts_at}
                type="button"
                onClick={() => setSlot(s)}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  slot?.starts_at === s.starts_at ? "border-white bg-white text-black" : "border-white/15 text-white hover:bg-white/10"
                }`}
              >
                {fmtTime(s.starts_at)}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-sm font-semibold text-white">2. What do you want to cover?</p>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white sm:w-auto sm:min-w-[280px]"
          >
            <option value="">Choose a module</option>
            {data.modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>

          <p className="mb-2 mt-6 text-sm font-semibold text-white">3. How often?</p>
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white sm:w-auto sm:min-w-[280px]"
          >
            <option value={1}>Just this once</option>
            {Array.from({ length: rules.repeat_max_weeks - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>Same time every week, for {n} weeks</option>
            ))}
          </select>
          {weeks > 1 ? (
            <p className="mt-1 text-xs text-white/50">Any week your teacher isn&apos;t free, or that goes over your sessions, is skipped and we&apos;ll tell you which.</p>
          ) : null}

          <div className="mt-6">
            <button
              type="button"
              disabled={!slot || !moduleId || busy}
              onClick={() => setConfirmBook(true)}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {busy ? "Booking…" : slot ? `Book ${fmtDay(slot.starts_at)}, ${fmtTime(slot.starts_at)}${weeks > 1 ? ` (${weeks} weeks)` : ""}` : "Book session"}
            </button>
          </div>
        </div>
      )}

      {extras && !data.blocked_reason ? (
        <div className={`rounded-2xl border p-5 ${usedUp ? "border-white/30 bg-white/[0.06]" : "border-white/15 bg-black/30"}`}>
          <p className="text-sm font-semibold text-white">Need more sessions?</p>
          <p className="mt-1 text-sm text-white/60">
            Extra sessions are {formatPrice(extras.price, extras.currency)} each
            {allowance.period === "month" ? ", for use this month" : ""}.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={extraCount}
              onChange={(e) => setExtraCount(Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              aria-label="Number of extra sessions"
            >
              {Array.from({ length: extras.max }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} session{n === 1 ? "" : "s"}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={buyExtras}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              Pay {formatPrice(extras.price * extraCount, extras.currency)}
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Your upcoming sessions</h2>
        {data.upcoming.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-sm text-white/60">Nothing booked yet.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
            {data.upcoming.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="text-white">{fmtFull(u.starts_at)}</p>
                  <p className="text-xs text-white/50">
                    {u.module_title ?? u.title}
                    {u.weekly ? " · weekly" : ""}
                    {u.booked_by === "teacher" ? " · scheduled by your teacher" : ""}
                  </p>
                </div>
                {u.can_cancel ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCancelling(u)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : (
                  <span className="text-xs text-white/40">Message your teacher to change</span>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-white/50">
          Book at least {rules.min_notice_hours} hours ahead. You can cancel up to {rules.cancel_window_hours} hours before a
          session; after that, message your teacher. Join your session from Classroom when it starts. Times are shown in your
          local time.
        </p>
      </div>

      {data.recent.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Recent sessions</h2>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
            {data.recent.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="text-white">{fmtFull(r.starts_at)}</p>
                  <p className="text-xs text-white/50">{r.module_title} · {outcomeLabel(r)}</p>
                </div>
                {r.can_report ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReporting(r)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                  >
                    My teacher didn&apos;t come
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmBook}
        title={weeks > 1 ? `Book ${weeks} weekly sessions?` : "Book this session?"}
        message={slot ? `${fmtFull(slot.starts_at)}${weeks > 1 ? `, then the same time every week for ${weeks} weeks,` : ""} with ${data.teacher_name ?? "your teacher"}.` : ""}
        confirmLabel="Book it"
        cancelLabel="Not yet"
        variant="default"
        onConfirm={book}
        onCancel={() => setConfirmBook(false)}
      />
      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this session?"
        message={cancelling ? `${fmtFull(cancelling.starts_at)}. The time will be offered to others.` : ""}
        confirmLabel="Cancel session"
        cancelLabel="Keep it"
        onConfirm={cancel}
        onCancel={() => setCancelling(null)}
      />
      <ConfirmDialog
        open={reporting !== null}
        title="Report a missed session?"
        message={reporting ? `Tell your academy your teacher didn't come on ${fmtFull(reporting.starts_at)}. They'll check and let you know.` : ""}
        confirmLabel="Send report"
        cancelLabel="Not now"
        variant="default"
        onConfirm={report}
        onCancel={() => setReporting(null)}
      />
    </div>
  );
}
