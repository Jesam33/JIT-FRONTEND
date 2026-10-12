"use client";

// Live quiz control panel for one live class (?class_type=&class_id=). The
// teacher keeps this tab open next to the Jitsi tab: pick or write a round,
// start it, and drive it question by question while students answer on their
// class screen. Shows answers coming in live, the right answer, standings, and
// a final podium with how the class did on each question.
// Shared with the owner portal's Teaching area (lib/teaching-base).
// Backend: StaffLiveQuizController.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STAFF_API } from "@/lib/api";
import { apiFetchStaff } from "@/lib/fetch-with-timeout";
import { useTeachingBase } from "@/lib/teaching-base";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";

type Question = { prompt: string; options: string[]; correct_index: number; seconds: number };
type Round = { id: number; course_id: number; title: string; questions: Question[] };
type Standing = { rank: number; name: string; points: number; correct: number; answered: number };
type RunState = {
  id: number;
  title: string;
  phase: "lobby" | "question" | "reveal" | "finished";
  index: number;
  total: number;
  auto_advance: boolean;
  server_now: string;
  deadline: string | null;
  joined: number;
  question: Question | null;
  next_question: string | null;
  distribution: number[];
  answered: number;
  standings: Standing[];
  per_question?: { prompt: string; answered: number; correct: number; percent: number }[];
};
type ClassData = {
  class: { class_type: string; class_id: number; title: string | null; course_id: number; course_title: string | null };
  rounds: Round[];
  run: RunState | null;
  past_runs: { id: number; title: string; questions: number; players: number; finished_at: string | null }[];
  seconds_options: number[];
};

const LETTERS = ["A", "B", "C", "D"];
const TILE = ["bg-rose-600", "bg-sky-600", "bg-amber-500", "bg-emerald-600"];
const MEDALS = ["🥇", "🥈", "🥉"];
const inputClass = "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/35";

const blankQuestion = (): Question => ({ prompt: "", options: ["", "", "", ""], correct_index: -1, seconds: 20 });

function firstError(j: { message?: string; errors?: Record<string, string[]> }, fallback: string): string {
  return (j?.errors ? Object.values(j.errors)[0]?.[0] : undefined) ?? j?.message ?? fallback;
}

export default function LiveQuizPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LiveQuizInner />
    </Suspense>
  );
}

function LiveQuizInner() {
  const params = useSearchParams();
  const base = useTeachingBase();
  const classType = params?.get("class_type") ?? "";
  const classId = Number(params?.get("class_id") ?? 0);

  const [data, setData] = useState<ClassData | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id: number | null; title: string; questions: Question[] } | null>(null);
  const [run, setRunState] = useState<RunState | null>(null);
  // Server clock minus browser clock, measured when each state arrives (the countdown uses it).
  const [offset, setOffset] = useState(0);
  const setRun = useCallback((r: RunState | null) => {
    if (r) setOffset(new Date(r.server_now).getTime() - Date.now());
    setRunState(r);
  }, []);
  const [viewing, setViewing] = useState(false); // a past run's results
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Round | null>(null);

  const load = useCallback(async () => {
    if (!classType || !classId) {
      setError("Open this from a class: Classroom → Live quiz.");
      return;
    }
    try {
      const res = await apiFetchStaff(STAFF_API.liveQuizClass(classType, classId));
      const json = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setError("Live quizzes are part of the Basic plan and above. Upgrade the academy's plan to use them.");
        return;
      }
      if (!res.ok) {
        setError(firstError(json, `Could not load this class (HTTP ${res.status}).`));
        return;
      }
      setError("");
      setData(json);
      setRun(json.run ?? null);
    } catch {
      setError("Could not load this class. Refresh to try again.");
    }
  }, [classType, classId, setRun]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  // Follow the running quiz (answers coming in, timer running out).
  const runId = run?.id;
  const runLive = !!run && run.phase !== "finished";
  useEffect(() => {
    if (!runId || !runLive) return;
    const t = setInterval(async () => {
      try {
        const res = await apiFetchStaff(STAFF_API.liveQuizRun(runId));
        if (res.ok) setRun((await res.json()).run);
      } catch {
        /* keep the last state */
      }
    }, 1500);
    return () => clearInterval(t);
  }, [runId, runLive, setRun]);

  const control = async (url: string, body?: unknown) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ kind: "err", text: firstError(json, "That didn't work. Try again.") });
      else if (json.run) setRun(json.run);
    } catch {
      // Slow or dropped connection: the action may still have happened on the
      // server, so re-read the real state rather than guessing.
      setMsg({ kind: "err", text: "The connection is slow. Checking where the quiz is…" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const startRound = (round: Round) => {
    setViewing(false);
    return control(STAFF_API.liveQuizStart(classType, classId), { round_id: round.id, auto_advance: autoAdvance });
  };

  const saveRound = async () => {
    if (!editing || !data) return;
    // Drop blank trailing answers, keeping the ticked one pointing at the same text.
    const questions = editing.questions.map((q) => {
      const keep = q.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o !== "");
      return { ...q, prompt: q.prompt.trim(), options: keep.map((x) => x.o), correct_index: keep.findIndex((x) => x.i === q.correct_index) };
    });
    const bad = questions.findIndex((q) => !q.prompt || q.options.length < 2 || q.correct_index < 0);
    if (!editing.title.trim()) {
      setMsg({ kind: "err", text: "Give the round a title." });
      return;
    }
    if (bad !== -1) {
      const q = questions[bad];
      setMsg({ kind: "err", text: `Question ${bad + 1}: ${!q.prompt ? "write the question" : q.options.length < 2 ? "give at least 2 answers" : "tick the correct answer"}.` });
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await apiFetchStaff(editing.id ? STAFF_API.liveQuizRound(editing.id) : STAFF_API.liveQuizRounds, {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ course_id: data.class.course_id, title: editing.title.trim(), questions }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: firstError(json, "Could not save the round.") });
        return;
      }
      setEditing(null);
      setMsg({ kind: "ok", text: "Round saved. Press Start when you're ready." });
      await load();
    } catch {
      // Timed out or dropped: the save may still have gone through (a slow
      // server finishes it after we stop waiting). Look before asking them to
      // save again, so a retry never creates a duplicate round.
      const title = editing.title.trim();
      const res = await apiFetchStaff(STAFF_API.liveQuizClass(classType, classId)).catch(() => null);
      const fresh: ClassData | null = res && res.ok ? await res.json().catch(() => null) : null;
      if (fresh) {
        setData(fresh);
        setRun(fresh.run ?? null);
      }
      const landed = fresh?.rounds.some((r) => (editing.id ? r.id === editing.id : r.title === title));
      if (landed && !editing.id) {
        setEditing(null);
        setMsg({ kind: "ok", text: "Round saved (the connection was slow). Press Start when you're ready." });
      } else {
        setMsg({ kind: "err", text: "The connection is slow and we couldn't confirm the save. Check your connection and press Save again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteRound = async (round: Round) => {
    setBusy(true);
    try {
      await apiFetchStaff(STAFF_API.liveQuizRound(round.id), { method: "DELETE", headers: { Accept: "application/json" } });
      await load();
    } catch {
      setMsg({ kind: "err", text: "The connection is slow. Refresh to check whether the round was deleted." });
    } finally {
      setBusy(false);
    }
  };

  const viewPast = async (id: number) => {
    try {
      const res = await apiFetchStaff(STAFF_API.liveQuizRun(id));
      if (res.ok) {
        setRun((await res.json()).run);
        setViewing(true);
      }
    } catch {
      setMsg({ kind: "err", text: "The connection is slow. Try opening the results again." });
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Link href={`${base}/classroom`} className="text-xs text-white/60 hover:text-white">← Classroom</Link>
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>
      </div>
    );
  }
  if (!data) return <LoadingSpinner />;

  const header = (
    <div>
      <Link href={`${base}/classroom`} className="text-xs text-white/60 hover:text-white">← Classroom</Link>
      <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Live quiz</h1>
      <p className="mt-1 text-sm text-white/60">
        {data.class.title ?? "Live class"} · {data.class.course_title}. Keep this tab open beside your class: questions pop up on your
        students&apos; class screen.
      </p>
    </div>
  );

  const banner = msg ? (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"}`}>
      {msg.text}
    </div>
  ) : null;

  // ── A quiz running (or a past one's results) ─────────────────────────────
  if (run && (run.phase !== "finished" || viewing || run.per_question)) {
    return (
      <div className="space-y-5 pb-8">
        {header}
        {banner}
        <RunPanel
          run={run}
          offset={offset}
          busy={busy}
          onNext={() => control(STAFF_API.liveQuizNext(run.id))}
          onReveal={() => control(STAFF_API.liveQuizReveal(run.id))}
          onFinish={() => control(STAFF_API.liveQuizFinish(run.id))}
          onAuto={(on) => control(STAFF_API.liveQuizAutoAdvance(run.id), { on })}
          onDone={() => {
            setRun(null);
            setViewing(false);
            void load();
          }}
        />
      </div>
    );
  }

  // ── Writing / editing a round ────────────────────────────────────────────
  if (editing) {
    return (
      <div className="space-y-5 pb-8">
        {header}
        {banner}
        <RoundEditor
          editing={editing}
          setEditing={setEditing}
          secondsOptions={data.seconds_options}
          courseId={data.class.course_id}
          busy={busy}
          onSave={saveRound}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  // ── Pick a round to start ────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {header}
      {banner}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Your rounds for this course</h2>
          <button
            type="button"
            onClick={() => setEditing({ id: null, title: "", questions: [blankQuestion()] })}
            className="rounded-lg bg-site-primary px-4 py-2 text-sm font-semibold text-[#fff] hover:brightness-110"
          >
            + New round
          </button>
        </div>

        <label className="mb-3 flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
          Auto-advance (move to the next question 8 seconds after each answer is shown)
        </label>

        {data.rounds.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center text-sm text-white/65">
            No rounds yet. Write one with as many questions as you like, or import your module quiz questions.
          </div>
        ) : (
          <div className="space-y-2">
            {data.rounds.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{r.title}</p>
                  <p className="text-xs text-white/50">{r.questions.length} question{r.questions.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => startRound(r)} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-[#fff] hover:bg-emerald-500 disabled:opacity-50">
                    ▶ Start in this class
                  </button>
                  <button type="button" onClick={() => setEditing({ id: r.id, title: r.title, questions: r.questions.map((q) => ({ ...q, options: [...q.options, "", "", ""].slice(0, 4) })) })} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40">
                    Edit
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(r)} className="rounded-lg px-3 py-1.5 text-xs text-red-300/80 hover:text-red-300">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.past_runs.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Played in this class</h2>
          <div className="space-y-2">
            {data.past_runs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => viewPast(p.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:border-white/25"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{p.title}</span>
                  <span className="text-xs text-white/50">
                    {p.questions} questions · {p.players} played{p.finished_at ? ` · ${new Date(p.finished_at).toLocaleString()}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-white/60">Results →</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this round?"
        message={confirmDelete ? `"${confirmDelete.title}" will be removed. Results of times you already played it are kept.` : ""}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        onConfirm={() => {
          const r = confirmDelete;
          setConfirmDelete(null);
          if (r) void deleteRound(r);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ── The live controls ──────────────────────────────────────────────────────

function RunPanel({
  run,
  offset,
  busy,
  onNext,
  onReveal,
  onFinish,
  onAuto,
  onDone,
}: {
  run: RunState;
  offset: number;
  busy: boolean;
  onNext: () => void;
  onReveal: () => void;
  onFinish: () => void;
  onAuto: (on: boolean) => void;
  onDone: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const isQuestion = run.phase === "question";
  useEffect(() => {
    if (!isQuestion) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [isQuestion]);
  const secondsLeft = run.deadline ? Math.max(0, Math.ceil((new Date(run.deadline).getTime() - (now + offset)) / 1000)) : 0;
  const isLast = run.index >= run.total - 1;
  const totalAnswers = run.distribution.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{run.title}</p>
          <p className="text-xs text-white/50">
            {run.phase === "lobby"
              ? `${run.total} questions · waiting to start`
              : run.phase === "finished"
                ? "Finished"
                : `Question ${run.index + 1} of ${run.total}`}
            {run.phase !== "finished" ? ` · ${run.joined} student${run.joined === 1 ? "" : "s"} following` : ""}
          </p>
        </div>
        {run.phase !== "finished" ? (
          <label className="flex items-center gap-2 text-xs text-white/65">
            <input type="checkbox" checked={run.auto_advance} disabled={busy} onChange={(e) => onAuto(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
            Auto-advance
          </label>
        ) : null}
      </div>

      {run.phase === "lobby" ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <p className="text-lg font-semibold text-white">Students see &quot;Get ready!&quot; on their class screen.</p>
          <p className="mt-1 text-sm text-white/60">Tell them a quiz is coming, then start the first question.</p>
          <button type="button" disabled={busy} onClick={onNext} className="mt-5 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-[#fff] hover:bg-emerald-500 disabled:opacity-50">
            ▶ Start question 1
          </button>
        </div>
      ) : null}

      {(run.phase === "question" || run.phase === "reveal") && run.question ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="whitespace-pre-line text-lg font-semibold text-white">{run.question.prompt}</p>
            {run.phase === "question" ? (
              <span className={`shrink-0 rounded-full px-3 py-1 font-mono text-lg font-bold ${secondsLeft <= 5 ? "bg-red-500/25 text-red-200" : "bg-white/10 text-white"}`}>
                {secondsLeft}s
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">Answer shown</span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/55">
            {run.answered} of {Math.max(run.joined, run.answered)} answered
          </p>

          <div className="mt-4 space-y-2">
            {run.question.options.map((opt, i) => {
              const n = run.distribution[i] ?? 0;
              const right = i === run.question?.correct_index;
              return (
                <div key={i} className={`relative overflow-hidden rounded-xl border px-3 py-2.5 ${right ? "border-emerald-400/60" : "border-white/10"}`}>
                  <span className={`absolute inset-y-0 left-0 ${right ? "bg-emerald-500/25" : "bg-white/[0.07]"}`} style={{ width: `${(n / totalAnswers) * 100}%` }} />
                  <span className="relative flex items-center justify-between gap-3 text-sm text-white">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-[#fff] ${TILE[i]}`}>{LETTERS[i]}</span>
                      <span className="break-words">{opt}</span>
                      {right ? <span className="text-xs text-emerald-300">✓ correct</span> : null}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{n}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {run.phase === "question" ? (
              <button type="button" disabled={busy} onClick={onReveal} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50">
                Show answer now
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={onNext} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-[#fff] hover:bg-emerald-500 disabled:opacity-50">
                {isLast ? "Show final results" : "▶ Next question"}
              </button>
            )}
            <button type="button" disabled={busy} onClick={onFinish} className="rounded-xl px-4 py-2.5 text-sm text-white/60 hover:text-white">
              End quiz
            </button>
          </div>
          {run.phase === "reveal" && !isLast && run.next_question ? (
            <p className="mt-2 text-xs text-white/40">Up next: {run.next_question}</p>
          ) : null}
        </div>
      ) : null}

      {run.phase === "finished" && run.per_question ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">How the class did</p>
          <div className="mt-3 space-y-2">
            {run.per_question.map((q, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 text-white/50">Q{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-white/80">{q.prompt}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${q.percent >= 70 ? "bg-emerald-500/15 text-emerald-300" : q.percent >= 40 ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}>
                  {q.percent}% right
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/40">Anything in red is worth going over again.</p>
        </div>
      ) : null}

      {run.standings.length > 0 ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">{run.phase === "finished" ? "Final standings" : "Standings"}</p>
          <ol className="space-y-1">
            {run.standings.map((s) => (
              <li key={s.rank} className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm ${s.rank <= 5 ? "bg-white/[0.05]" : ""}`}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-7 shrink-0 text-center">{MEDALS[s.rank - 1] ?? s.rank}</span>
                  <span className="truncate text-white">{s.name}</span>
                </span>
                <span className="shrink-0 text-xs text-white/50">{s.correct} right</span>
                <span className="w-16 shrink-0 text-right font-semibold tabular-nums text-white">{s.points}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : run.phase !== "lobby" ? (
        <p className="text-sm text-white/50">No answers yet.</p>
      ) : null}

      {run.phase === "finished" ? (
        <button type="button" onClick={onDone} className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40">
          Done
        </button>
      ) : null}
    </div>
  );
}

// ── Writing a round ────────────────────────────────────────────────────────

type ModuleRow = { module_id: number; module_title: string; course_id: number; quiz: { id: number } | null };

function RoundEditor({
  editing,
  setEditing,
  secondsOptions,
  courseId,
  busy,
  onSave,
  onCancel,
}: {
  editing: { id: number | null; title: string; questions: Question[] };
  setEditing: (e: { id: number | null; title: string; questions: Question[] }) => void;
  secondsOptions: number[];
  courseId: number;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [modules, setModules] = useState<ModuleRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  const update = (i: number, patch: Partial<Question>) =>
    setEditing({ ...editing, questions: editing.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) });

  const openImport = async () => {
    setImporting(true);
    if (modules) return;
    try {
      const res = await apiFetchStaff(STAFF_API.quizzes);
      const json = await res.json().catch(() => ({}));
      setModules(((json.modules ?? []) as ModuleRow[]).filter((m) => m.course_id === courseId && m.quiz));
    } catch {
      setModules([]);
    }
  };

  const importFrom = async (moduleId: number) => {
    const res = await apiFetchStaff(STAFF_API.moduleQuiz(moduleId));
    const json = await res.json().catch(() => ({}));
    const qs: Question[] = (json?.quiz?.questions ?? []).map((q: { prompt: string; options: string[]; correct_index: number }) => ({
      prompt: q.prompt,
      options: [...q.options, "", "", ""].slice(0, 4),
      correct_index: q.correct_index,
      seconds: 20,
    }));
    const kept = editing.questions.filter((q) => q.prompt.trim() !== "");
    setEditing({ ...editing, title: editing.title || json?.quiz?.title || "", questions: [...kept, ...qs] });
    setImporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Round title</span>
          <input className={inputClass} value={editing.title} maxLength={160} placeholder="e.g. Week 3 warm-up" onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={openImport} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40">
            Import questions from a module quiz
          </button>
          <span className="text-xs text-white/40">
            {editing.questions.length} question{editing.questions.length === 1 ? "" : "s"}
          </span>
        </div>
        {importing ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            {modules === null ? (
              <p className="text-xs text-white/50">Loading module quizzes…</p>
            ) : modules.length === 0 ? (
              <p className="text-xs text-white/50">No module quizzes in this course yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => (
                  <button key={m.module_id} type="button" onClick={() => importFrom(m.module_id)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15">
                    {m.module_title}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setImporting(false)} className="mt-2 text-xs text-white/50 hover:text-white">
              Close
            </button>
          </div>
        ) : null}
      </div>

      {editing.questions.map((q, i) => (
        <fieldset key={i} className="space-y-3 rounded-2xl border border-white/15 bg-black/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <legend className="text-sm font-semibold text-white">Question {i + 1}</legend>
            <div className="flex items-center gap-2">
              <select className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white" value={q.seconds} onChange={(e) => update(i, { seconds: Number(e.target.value) })} aria-label="Time limit">
                {secondsOptions.map((s) => (
                  <option key={s} value={s}>
                    {s} seconds
                  </option>
                ))}
              </select>
              {editing.questions.length > 1 ? (
                <button type="button" onClick={() => setEditing({ ...editing, questions: editing.questions.filter((_, k) => k !== i) })} className="text-xs text-red-300/80 hover:text-red-300">
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <textarea className={inputClass} rows={2} maxLength={300} value={q.prompt} placeholder="Type the question" onChange={(e) => update(i, { prompt: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`lq-correct-${i}`}
                  checked={q.correct_index === oi}
                  onChange={() => update(i, { correct_index: oi })}
                  className="h-4 w-4 shrink-0 accent-emerald-500"
                  aria-label={`Answer ${LETTERS[oi]} is correct`}
                />
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-[#fff] ${TILE[oi]}`}>{LETTERS[oi]}</span>
                <input
                  className={inputClass}
                  value={opt}
                  maxLength={120}
                  placeholder={`Answer ${LETTERS[oi]}${oi >= 2 ? " (optional)" : ""}`}
                  onChange={(e) => update(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/40">Tick the circle beside the correct answer.</p>
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEditing({ ...editing, questions: [...editing.questions, blankQuestion()] })}
          className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:border-white/40"
        >
          + Add question
        </button>
        <button type="button" disabled={busy} onClick={onSave} className="rounded-lg bg-site-primary px-5 py-2.5 text-sm font-semibold text-[#fff] hover:brightness-110 disabled:opacity-50">
          {busy ? "Saving…" : "Save round"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm text-white/60 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
