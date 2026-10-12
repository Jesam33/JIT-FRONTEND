"use client";

// The live quiz, student side: sits over the embedded class video (fullscreen
// included) and follows the teacher's quiz. Lobby → question with a countdown
// and four big answer buttons → reveal (right answer, your points, the top 5)
// → … → final podium. It can be minimized to keep watching the teacher.
//
// It polls the server (every 1.5 s while a quiz runs, 5 s otherwise), so it
// works with no real-time setup at all. The server owns the clock and the
// state; this only draws it. Backend: StudentLiveQuizController.

import { useEffect, useRef, useState } from "react";
import { STUDENT_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";

type Standing = { rank: number; name: string; points: number; correct: number; answered: number; you: boolean };

type StudentRun = {
  id: number;
  title: string;
  phase: "lobby" | "question" | "reveal" | "finished";
  index: number;
  total: number;
  server_now: string;
  question?: { prompt: string; options: string[]; seconds: number };
  deadline?: string | null;
  my_choice?: number | null;
  correct_index?: number;
  my_correct?: boolean | null;
  my_points?: number;
  distribution?: number[];
  top?: Standing[];
  me?: { rank: number; points: number; correct: number; of: number } | null;
};

// Kahoot-style colour per answer, so "the red one" is easy to say out loud.
const TILES = [
  { letter: "A", cls: "bg-rose-600 hover:bg-rose-500" },
  { letter: "B", cls: "bg-sky-600 hover:bg-sky-500" },
  { letter: "C", cls: "bg-amber-500 hover:bg-amber-400" },
  { letter: "D", cls: "bg-emerald-600 hover:bg-emerald-500" },
];
const MEDALS = ["🥇", "🥈", "🥉"];

export default function LiveQuizOverlay({ classType, classId }: { classType: string; classId: number }) {
  const [run, setRun] = useState<StudentRun | null>(null);
  const [offset, setOffset] = useState(0); // server clock minus browser clock
  const [now, setNow] = useState(() => Date.now());
  const [minimized, setMinimized] = useState(false);
  const [dismissedRun, setDismissedRun] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  // This screen's latest tap (null choice = cleared after a failed send).
  const [pick, setPick] = useState<{ runId: number; index: number; choice: number | null } | null>(null);
  const [note, setNote] = useState("");
  const lastKey = useRef("");

  // Follow the quiz. Fast while one is running, slow while there's none.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      let delay = 5000;
      try {
        const res = await apiFetch(STUDENT_API.liveQuiz(classType, classId));
        if (res.ok) {
          const json = await res.json();
          const next: StudentRun | null = json?.run ?? null;
          if (!cancelled) {
            if (next) setOffset(new Date(next.server_now).getTime() - Date.now());
            setRun(next);
            // A new question (or phase) pops the panel back open.
            const key = next ? `${next.id}:${next.phase}:${next.index}` : "";
            if (key !== lastKey.current) {
              lastKey.current = key;
              setMinimized(false);
              setNote("");
            }
          }
          if (next && next.phase !== "finished") delay = 1500;
        }
      } catch {
        /* keep the last state; try again shortly */
      }
      if (!cancelled) timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 300);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [classType, classId]);

  // Countdown tick while a question is open.
  const questionOpen = run?.phase === "question";
  useEffect(() => {
    if (!questionOpen) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [questionOpen]);

  if (!run || dismissedRun === run.id) return null;

  // The answer to show as picked: this screen's latest tap for this question
  // wins over a poll that left before it, else what the server has.
  const myChoice = pick && pick.runId === run.id && pick.index === run.index ? pick.choice : run.my_choice ?? null;

  // Students can change their answer until the timer ends; the last tap counts.
  const answer = async (choice: number) => {
    if (!run || run.phase !== "question" || sending || choice === myChoice) return;
    const previous = myChoice;
    setSending(true);
    setNote("");
    setPick({ runId: run.id, index: run.index, choice }); // show it straight away
    try {
      const res = await apiFetch(STUDENT_API.liveQuizAnswer(run.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ question_index: run.index, choice }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setNote(j?.message || "That answer didn't go through.");
        setPick({ runId: run.id, index: run.index, choice: previous });
      }
    } catch {
      setNote("No connection. Tap again.");
      setPick({ runId: run.id, index: run.index, choice: previous });
    } finally {
      setSending(false);
    }
  };

  const remainingMs = run.deadline ? new Date(run.deadline).getTime() - (now + offset) : 0;
  const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
  const seconds = run.question?.seconds ?? 20;
  const qLabel = run.index >= 0 ? `Question ${run.index + 1} of ${run.total}` : `${run.total} questions`;

  // ── Minimized pill ────────────────────────────────────────────────────
  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-site-primary px-4 py-2 text-sm font-semibold text-[#fff] shadow-xl"
      >
        🎯 Live quiz · {run.phase === "question" ? (myChoice != null ? `answered · ${secondsLeft}s left` : `${secondsLeft}s to answer`) : qLabel} · Open
      </button>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 max-h-[75%] overflow-y-auto rounded-t-2xl border-t border-white/15 bg-[#0b0b0b]/95 p-4 text-white shadow-2xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[440px] sm:rounded-2xl sm:border">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/50">🎯 Live quiz · {run.title}</p>
          <p className="text-xs text-white/40">{qLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {run.phase === "question" ? (
            <span className={`rounded-full px-2.5 py-1 font-mono text-sm font-bold ${secondsLeft <= 5 ? "bg-red-500/25 text-red-200" : "bg-white/10"}`}>
              {secondsLeft}s
            </span>
          ) : null}
          {run.phase === "finished" ? (
            <button type="button" onClick={() => setDismissedRun(run.id)} className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white">
              Close
            </button>
          ) : (
            <button type="button" onClick={() => setMinimized(true)} className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white" aria-label="Minimize quiz">
              Hide
            </button>
          )}
        </div>
      </div>

      {run.phase === "lobby" ? (
        <div className="py-4 text-center">
          <p className="text-lg font-semibold">Get ready!</p>
          <p className="mt-1 text-sm text-white/60">Your teacher is about to start the quiz. Quicker right answers score more, and you can change your answer until the time runs out.</p>
        </div>
      ) : null}

      {run.phase === "question" && run.question ? (
        <>
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-site-primary transition-all duration-200" style={{ width: `${Math.min(100, (remainingMs / (seconds * 1000)) * 100)}%` }} />
          </div>
          <p className="mb-3 whitespace-pre-line text-base font-semibold leading-snug">{run.question.prompt}</p>
          <div className="grid grid-cols-2 gap-2">
            {run.question.options.map((opt, i) => {
              const picked = myChoice === i;
              const answered = myChoice != null;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={secondsLeft === 0}
                  aria-pressed={picked}
                  onClick={() => answer(i)}
                  className={`flex min-h-[64px] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#fff] transition ${TILES[i].cls} ${
                    answered && !picked ? "opacity-45 hover:opacity-80" : ""
                  } ${picked ? "ring-4 ring-white" : ""}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black/25 text-xs">{TILES[i].letter}</span>
                  <span className="min-w-0 break-words">{opt}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-white/55">
            {secondsLeft === 0
              ? "Time's up!"
              : myChoice != null
                ? "Answer saved ✓ Tap another answer to change it."
                : "Tap your answer"}
          </p>
          {note ? <p className="mt-1 text-center text-xs text-amber-200">{note}</p> : null}
        </>
      ) : null}

      {run.phase === "reveal" && run.question ? (
        <>
          <div
            className={`mb-3 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
              run.my_correct ? "bg-emerald-500/20 text-emerald-200" : run.my_choice != null ? "bg-rose-500/20 text-rose-200" : "bg-white/10 text-white/70"
            }`}
          >
            {run.my_correct ? `Correct! +${run.my_points ?? 0} points` : run.my_choice != null ? "Not quite this time" : "No answer this time"}
          </div>
          <p className="mb-2 text-sm font-semibold leading-snug text-white/85">{run.question.prompt}</p>
          <div className="space-y-1.5">
            {run.question.options.map((opt, i) => {
              const n = run.distribution?.[i] ?? 0;
              const total = (run.distribution ?? []).reduce((a, b) => a + b, 0) || 1;
              const right = i === run.correct_index;
              return (
                <div key={i} className={`relative overflow-hidden rounded-lg border px-3 py-2 text-sm ${right ? "border-emerald-400/60" : "border-white/10"}`}>
                  <span className={`absolute inset-y-0 left-0 ${right ? "bg-emerald-500/25" : "bg-white/[0.06]"}`} style={{ width: `${(n / total) * 100}%` }} />
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="min-w-0 break-words">
                      {TILES[i].letter}. {opt} {right ? "✓" : ""} {run.my_choice === i && !right ? "(you)" : ""}
                    </span>
                    <span className="shrink-0 text-xs text-white/60">{n}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <Leaders top={run.top} me={run.me} />
        </>
      ) : null}

      {run.phase === "finished" ? (
        <>
          <p className="mb-3 text-center text-lg font-bold">Final results</p>
          <div className="mb-3 flex items-end justify-center gap-2">
            {[1, 0, 2].map((i) => {
              const r = run.top?.[i];
              if (!r) return <div key={i} className="w-24" />;
              const height = i === 0 ? "h-24" : i === 1 ? "h-16" : "h-12";
              return (
                <div key={i} className="flex w-24 flex-col items-center">
                  <span className="text-2xl">{MEDALS[i]}</span>
                  <span className={`mt-1 w-full truncate text-center text-xs font-semibold ${r.you ? "text-white" : "text-white/80"}`}>{r.name}</span>
                  <div className={`mt-1 flex w-full items-start justify-center rounded-t-lg bg-white/10 pt-1 text-xs font-bold ${height}`}>{r.points}</div>
                </div>
              );
            })}
          </div>
          {run.me ? (
            <p className="text-center text-sm text-white/75">
              You finished <span className="font-bold text-white">#{run.me.rank}</span> of {run.me.of} with {run.me.points} points ({run.me.correct}/{run.total} right).
            </p>
          ) : (
            <p className="text-center text-sm text-white/60">You didn&apos;t answer this round.</p>
          )}
        </>
      ) : null}
    </div>
  );
}

function Leaders({ top, me }: { top?: Standing[]; me?: StudentRun["me"] }) {
  if (!top || top.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl bg-white/[0.04] p-2">
      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/45">Top {top.length}</p>
      {top.map((r) => (
        <div key={r.rank} className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${r.you ? "bg-site-primary/25" : ""}`}>
          <span className="flex min-w-0 items-center gap-2">
            <span className="w-6 shrink-0 text-center">{MEDALS[r.rank - 1] ?? r.rank}</span>
            <span className="truncate">{r.name}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums">{r.points}</span>
        </div>
      ))}
      {me && me.rank > top.length ? (
        <p className="mt-1 px-2 text-xs text-white/60">
          You: #{me.rank} · {me.points} points
        </p>
      ) : null}
    </div>
  );
}
