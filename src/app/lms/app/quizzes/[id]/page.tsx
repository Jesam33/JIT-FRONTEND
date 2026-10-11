"use client";

// One module quiz, student side: an intro card, then one question per screen
// (answers saved as you go, so a dropped connection loses nothing), a review
// step, then the score and the class scoreboard (refreshing while the quiz is
// open). The correct answers are only shown once the quiz has closed.
// The countdown runs on the server's clock (server_now offset); when time is up
// the attempt is submitted with whatever was saved.
// Backend: StudentQuizController.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { STUDENT_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";
import LoadingSpinner from "@/components/LoadingSpinner";
import Scoreboard, { formatDuration, type ScoreRow } from "@/components/quiz/Scoreboard";

type State = "not_started" | "in_progress" | "submitted" | "closed";

type Attempt = {
  started_at: string;
  deadline: string | null;
  answers: Record<string, number>;
  questions: { id: number; prompt: string; options: string[] }[];
};

type ReviewItem = {
  id: number;
  prompt: string;
  options: string[];
  your_answer: number | null;
  correct_index: number;
  explanation: string | null;
};

type QuizPayload = {
  id: number;
  title: string;
  module_title: string | null;
  questions: number;
  time_limit_minutes: number | null;
  closes_at: string | null;
  closed: boolean;
  state: State;
  score: number | null;
  total: number | null;
  duration_seconds: number | null;
  instructions?: string | null;
  server_now?: string;
  attempt?: Attempt;
  review?: ReviewItem[];
};

const LETTERS = ["A", "B", "C", "D"];
const SCOREBOARD_REFRESH_MS = 20_000;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function fmtClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function StudentQuizPage() {
  const params = useParams();
  const quizId = Number(params?.id);

  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0); // 0..n-1 questions, n = review screen
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0); // server clock minus browser clock
  const submittingRef = useRef(false);

  const syncClock = (serverNow?: string) => {
    if (serverNow) setOffset(new Date(serverNow).getTime() - Date.now());
  };

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(STUDENT_API.quiz(quizId));
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(res.status === 404 ? "This quiz isn't available." : json?.message || "Couldn't load this quiz.");
        return;
      }
      syncClock(json.server_now);
      setQuiz(json);
      if (json.attempt) {
        setAttempt(json.attempt);
        setAnswers(json.attempt.answers ?? {});
      } else {
        setAttempt(null);
      }
    } catch {
      setLoadError("Couldn't load this quiz. Refresh the page to try again.");
    }
  }, [quizId]);

  const loadScoreboard = useCallback(async () => {
    try {
      const res = await apiFetch(STUDENT_API.quizScoreboard(quizId));
      if (!res.ok) return;
      const json = await res.json();
      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch {
      /* keep the last board */
    }
  }, [quizId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const finished = quiz?.state === "submitted" || quiz?.state === "closed";

  // Scoreboard: once I'm done (or it's closed), and refreshed while still open.
  useEffect(() => {
    if (!finished) return;
    (async () => {
      await loadScoreboard();
    })();
    if (quiz?.closed) return;
    const t = setInterval(loadScoreboard, SCOREBOARD_REFRESH_MS);
    return () => clearInterval(t);
  }, [finished, quiz?.closed, loadScoreboard]);

  const submit = useCallback(
    async (final: Record<string, number>) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setBusy(true);
      setMsg("");
      try {
        const res = await apiFetch(STUDENT_API.quizSubmit(quizId), {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ answers: final }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setMsg(json?.message || "Couldn't submit. Please try again.");
          submittingRef.current = false;
          return;
        }
        setAttempt(null);
        await load();
      } catch {
        setMsg("Couldn't submit. Check your connection and try again.");
        submittingRef.current = false;
      } finally {
        setBusy(false);
      }
    },
    [quizId, load],
  );

  // Countdown tick while an attempt with a deadline is open.
  const deadlineMs = attempt?.deadline ? new Date(attempt.deadline).getTime() : null;
  useEffect(() => {
    if (!deadlineMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadlineMs]);

  const remaining = deadlineMs ? deadlineMs - (now + offset) : null;

  // Time up: hand in what's saved (once; the server also marks it on next load).
  const timeUpRef = useRef(false);
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && attempt && !timeUpRef.current) {
      timeUpRef.current = true;
      (async () => {
        await submit(answers);
      })();
    }
  }, [remaining, attempt, answers, submit]);

  const start = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await apiFetch(STUDENT_API.quizStart(quizId), { method: "POST", headers: { Accept: "application/json" } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          await load();
          return;
        }
        setMsg(json?.message || "Couldn't start the quiz.");
        return;
      }
      syncClock(json.server_now);
      setAttempt(json.attempt);
      setAnswers(json.attempt?.answers ?? {});
      setStep(0);
      setQuiz((q) => (q ? { ...q, state: "in_progress" } : q));
    } catch {
      setMsg("Couldn't start the quiz. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (questionId: number, index: number) => {
    const next = { ...answers, [String(questionId)]: index };
    setAnswers(next);
    // Save in the background; Submit sends everything again anyway.
    apiFetch(STUDENT_API.quizAnswers(quizId), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ answers: { [String(questionId)]: index } }),
    }).catch(() => undefined);
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/lms/app/quizzes" className="text-xs text-white/60 hover:text-white">← All quizzes</Link>
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{loadError}</div>
      </div>
    );
  }
  if (!quiz) return <LoadingSpinner />;

  const header = (
    <div>
      {quiz.module_title ? <p className="text-xs uppercase tracking-wide text-white/45">{quiz.module_title}</p> : null}
      <h1 className="mt-1 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{quiz.title}</h1>
    </div>
  );

  const notice = msg ? <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{msg}</div> : null;

  // ── Taking it ──────────────────────────────────────────────────────────
  if (attempt) {
    const qs = attempt.questions;
    const total = qs.length;
    const answered = qs.filter((q) => answers[String(q.id)] !== undefined).length;
    const onReview = step >= total;
    const q = qs[Math.min(step, total - 1)];
    const lowTime = remaining !== null && remaining < 60_000;

    return (
      <div className="space-y-6 pb-8">
        {header}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-white/55">
            <span>{onReview ? "Review your answers" : `Question ${step + 1} of ${total}`}</span>
            {remaining !== null ? (
              <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${lowTime ? "bg-red-500/20 text-red-200" : "bg-white/10 text-white"}`}>
                {fmtClock(remaining)}
              </span>
            ) : null}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-site-primary transition-all duration-300"
              style={{ width: `${((onReview ? total : step + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {notice}

        {!onReview && q ? (
          <div>
            <h2 className="whitespace-pre-line text-lg font-semibold leading-snug text-white">{q.prompt}</h2>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Answers">
              {q.options.map((opt, oi) => {
                const picked = answers[String(q.id)] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => choose(q.id, oi)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-white/30 ${
                      picked ? "border-site-primary bg-site-primary/15 text-white" : "border-white/10 bg-white/[0.03] text-white/85 hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        picked ? "bg-site-primary text-[#fff]" : "bg-white/10 text-white/60"
                      }`}
                    >
                      {LETTERS[oi]}
                    </span>
                    <span className="min-w-0 flex-1 break-words">{opt}</span>
                    {picked ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-white" aria-hidden="true">
                        <path d="M5 12.5 10 17 19 7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {onReview ? (
          <div>
            <h2 className="text-lg font-semibold text-white">
              You&apos;ve answered {answered} of {total}
            </h2>
            {answered < total ? (
              <p className="mt-1 text-sm text-amber-200">Unanswered questions count as wrong. Tap a number to go back to it.</p>
            ) : (
              <p className="mt-1 text-sm text-white/55">Tap a number to change an answer before you submit.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {qs.map((x, i) => {
                const done = answers[String(x.id)] !== undefined;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setStep(i)}
                    className={`h-10 w-10 rounded-lg text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-white/30 ${
                      done ? "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" : "bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                    }`}
                    aria-label={`Question ${i + 1}${done ? "" : " (unanswered)"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-white/45">You only get one try. Once you submit, you can&apos;t change your answers.</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          {step > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-lg px-2 py-2 text-sm font-medium text-white/60 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40"
            >
              ← Previous
            </button>
          ) : (
            <span />
          )}
          {onReview ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => submit(answers)}
              className="h-10 rounded-lg bg-site-primary px-5 text-sm font-semibold text-[#fff] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit quiz"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="h-10 rounded-lg bg-site-primary px-5 text-sm font-semibold text-[#fff] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {step === total - 1 ? "Review answers →" : "Next →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Not started ────────────────────────────────────────────────────────
  if (quiz.state === "not_started") {
    return (
      <div className="space-y-5 pb-8">
        {header}
        {notice}
        <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
          {quiz.instructions ? <p className="whitespace-pre-line text-sm text-white/80">{quiz.instructions}</p> : null}
          <ul className={`space-y-1.5 text-sm text-white/70 ${quiz.instructions ? "mt-4" : ""}`}>
            <li>• {quiz.questions} multiple-choice questions</li>
            <li>• {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} minutes once you start (the timer keeps running if you leave)` : "No time limit"}</li>
            <li>• One try only. Your score shows as soon as you submit.</li>
            <li>• Ties on the scoreboard go to whoever finished faster.</li>
            {quiz.closes_at ? <li>• Closes {fmtDate(quiz.closes_at)}</li> : null}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={start}
            className="mt-6 w-full rounded-lg bg-site-primary px-5 py-3 text-sm font-semibold text-[#fff] hover:brightness-110 disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Starting…" : "Start quiz"}
          </button>
        </div>
      </div>
    );
  }

  // ── Done (or missed) ───────────────────────────────────────────────────
  const percent = quiz.score !== null && quiz.total ? Math.round((quiz.score / quiz.total) * 100) : null;
  const myRow = rows?.find((r) => r.you);

  return (
    <div className="space-y-6 pb-8">
      {header}
      {notice}

      {quiz.state === "submitted" ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-white/50">Your score</p>
          <p className="mt-1 text-5xl font-bold text-white">
            {quiz.score}/{quiz.total}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {percent}%{quiz.duration_seconds !== null ? ` · ${formatDuration(quiz.duration_seconds)}` : ""}
            {myRow ? ` · ranked #${myRow.rank}` : ""}
          </p>
          {myRow?.top ? <p className="mt-3 text-sm font-semibold text-amber-200">You&apos;re in the top 5!</p> : null}
          {!quiz.closed ? (
            <p className="mt-4 text-xs text-white/50">
              The correct answers appear here once the quiz closes{quiz.closes_at ? ` (${fmtDate(quiz.closes_at)})` : ""}.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-6 text-center text-sm text-white/70">
          This quiz closed before you took it.
        </div>
      )}

      {quiz.review?.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Answers</h2>
          <div className="space-y-3">
            {quiz.review.map((r, i) => {
              const right = r.your_answer === r.correct_index;
              return (
                <div key={r.id} className="rounded-2xl border border-white/15 bg-black/30 p-5">
                  <p className="text-sm font-semibold text-white">
                    <span className={right ? "text-emerald-300" : "text-red-300"}>{right ? "✓" : "✗"}</span> {i + 1}. {r.prompt}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {r.options.map((opt, oi) => {
                      const isCorrect = oi === r.correct_index;
                      const isMine = oi === r.your_answer;
                      return (
                        <div
                          key={oi}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            isCorrect ? "bg-emerald-500/15 text-emerald-100" : isMine ? "bg-red-500/15 text-red-100" : "text-white/60"
                          }`}
                        >
                          {LETTERS[oi]}. {opt}
                          {isCorrect ? " (correct)" : isMine ? " (your answer)" : ""}
                        </div>
                      );
                    })}
                    {r.your_answer === null ? <p className="text-xs text-amber-200">You didn&apos;t answer this one.</p> : null}
                  </div>
                  {r.explanation ? <p className="mt-3 text-xs text-white/60">{r.explanation}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Scoreboard</h2>
          {!quiz.closed ? <span className="text-[11px] text-white/40">Updates as classmates finish</span> : null}
        </div>
        {rows ? <Scoreboard rows={rows} /> : <LoadingSpinner />}
      </section>
    </div>
  );
}
