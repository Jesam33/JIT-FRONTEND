"use client";

// Module quizzes, teacher side: every module of my courses with its quiz,
// a writer for one module's quiz (exactly 5 multiple-choice questions), and
// the results with the full-name scoreboard. One page, three views, chosen by
// ?module= (writer) or ?results= (results) so each is linkable.
// Shared with the owner portal's Teaching area (lib/teaching-base).
// Backend: StaffQuizController.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STAFF_API } from "@/lib/api";
import { apiFetchStaff } from "@/lib/fetch-with-timeout";
import { useTeachingBase } from "@/lib/teaching-base";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import Scoreboard, { type ScoreRow } from "@/components/quiz/Scoreboard";

type ModuleRow = {
  module_id: number;
  module_title: string;
  course_id: number;
  course_title: string | null;
  quiz: { id: number; title: string; status: "draft" | "published"; closes_at: string | null; closed: boolean; taken: number; average: number | null } | null;
};

type Question = { prompt: string; options: string[]; correct_index: number | null; explanation: string };

type Quiz = {
  id: number;
  module_id: number;
  title: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  closes_at: string | null;
  closed: boolean;
  status: "draft" | "published";
  taken: boolean;
  questions: { id: number; prompt: string; options: string[]; correct_index: number; explanation: string | null }[];
};

const QUESTIONS = 5;
const inputClass = "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/35";

function firstError(j: { message?: string; errors?: Record<string, string[]> }, fallback: string): string {
  const fromErrors = j?.errors ? Object.values(j.errors)[0]?.[0] : undefined;
  return fromErrors ?? j?.message ?? fallback;
}

// datetime-local value for an ISO time, in the browser's local time.
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function StaffQuizzesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QuizzesInner />
    </Suspense>
  );
}

function QuizzesInner() {
  const params = useSearchParams();
  const moduleId = params?.get("module");
  const resultsId = params?.get("results");

  if (moduleId) return <QuizWriter moduleId={Number(moduleId)} />;
  if (resultsId) return <QuizResults quizId={Number(resultsId)} />;
  return <QuizList />;
}

function useQuizNav() {
  const router = useRouter();
  const base = useTeachingBase();
  return {
    list: () => router.push(`${base}/quizzes`),
    // Back to the list carrying a one-off "published" flag for the success banner.
    listPublished: () => router.push(`${base}/quizzes?published=1`),
    write: (moduleId: number) => router.push(`${base}/quizzes?module=${moduleId}`),
    results: (quizId: number) => router.push(`${base}/quizzes?results=${quizId}`),
  };
}

// ── List ─────────────────────────────────────────────────────────────────

const PUBLISHED_TEXT = "Quiz published! Your students have been notified and can take it now.";

function QuizList() {
  const nav = useQuizNav();
  const router = useRouter();
  const base = useTeachingBase();
  const params = useSearchParams();
  const justPublished = params?.get("published") === "1";
  const [rows, setRows] = useState<ModuleRow[] | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(() =>
    justPublished ? { kind: "ok", text: PUBLISHED_TEXT } : null,
  );

  // Drop the one-off flag from the URL so a refresh doesn't repeat the banner.
  useEffect(() => {
    if (justPublished) router.replace(`${base}/quizzes`, { scroll: false });
  }, [justPublished, router, base]);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "close" | "delete"; quizId: number; title: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetchStaff(STAFF_API.quizzes);
      const json = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setError("Quizzes are part of the Basic plan and above. Upgrade the academy's plan to use them.");
        setRows([]);
        return;
      }
      if (!res.ok) {
        setError(json?.message || `Could not load quizzes (HTTP ${res.status}).`);
        setRows([]);
        return;
      }
      setError("");
      setRows(json.modules ?? []);
    } catch {
      setError("Could not load quizzes. Refresh to try again.");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const act = async (quizId: number, url: string, method: string, okText: string) => {
    setBusy(quizId);
    setMsg(null);
    try {
      const res = await apiFetchStaff(url, { method, headers: { Accept: "application/json" } });
      const json = await res.json().catch(() => ({}));
      setMsg(res.ok ? { kind: "ok", text: okText } : { kind: "err", text: firstError(json, "Something went wrong.") });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  };

  if (!rows) return <LoadingSpinner />;

  // Group modules under their course.
  const courses = rows.reduce<Record<string, ModuleRow[]>>((acc, r) => {
    const key = r.course_title ?? "Course";
    (acc[key] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Quizzes</h1>
        <p className="mt-1 text-sm text-white/60">
          One quiz per module: {QUESTIONS} multiple-choice questions, marked automatically. Students see their score straight
          away and a class scoreboard with the top 5 highlighted.
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}
      {msg ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"}`}>
          {msg.text}
        </div>
      ) : null}

      {rows.length === 0 && !error ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center text-sm text-white/70">
          No modules yet. Add modules to your course first, then write a quiz for each.
        </div>
      ) : null}

      {Object.entries(courses).map(([course, modules]) => (
        <section key={course}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">{course}</h2>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/30">
            {modules.map((m) => {
              const q = m.quiz;
              const status = !q
                ? { text: "No quiz yet", tone: "bg-white/10 text-white/60" }
                : q.status === "draft"
                  ? { text: "Draft", tone: "bg-amber-500/15 text-amber-300" }
                  : q.closed
                    ? { text: "Closed", tone: "bg-white/10 text-white/60" }
                    : { text: "Live", tone: "bg-emerald-500/15 text-emerald-300" };

              return (
                <div key={m.module_id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{m.module_title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/50">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.text}</span>
                      {q && q.status === "published" ? (
                        <span>
                          {q.taken} taken{q.average !== null ? ` · average ${q.average}/${QUESTIONS}` : ""}
                          {q.closes_at && !q.closed ? ` · closes ${fmtDate(q.closes_at)}` : ""}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => nav.write(m.module_id)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40">
                      {q ? (q.taken > 0 ? "View / edit" : "Edit") : "Write quiz"}
                    </button>
                    {q && q.status === "draft" ? (
                      <button
                        type="button"
                        disabled={busy === q.id}
                        onClick={() => act(q.id, STAFF_API.quizPublish(q.id), "POST", PUBLISHED_TEXT)}
                        className="rounded-lg bg-site-primary px-3 py-1.5 text-xs font-semibold text-[#fff] disabled:opacity-50"
                      >
                        Publish
                      </button>
                    ) : null}
                    {q && q.status === "published" ? (
                      <button type="button" onClick={() => nav.results(q.id)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40">
                        Results
                      </button>
                    ) : null}
                    {q && q.status === "published" && !q.closed ? (
                      <button type="button" disabled={busy === q.id} onClick={() => setConfirm({ kind: "close", quizId: q.id, title: q.title })} className="rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white">
                        Close now
                      </button>
                    ) : null}
                    {q && q.taken === 0 ? (
                      <button type="button" disabled={busy === q.id} onClick={() => setConfirm({ kind: "delete", quizId: q.id, title: q.title })} className="rounded-lg px-3 py-1.5 text-xs text-red-300/80 hover:text-red-300">
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "delete" ? "Delete this quiz?" : "Close this quiz now?"}
        message={
          confirm?.kind === "delete"
            ? `"${confirm.title}" will be removed. Nobody has taken it yet.`
            : "Students who haven't taken it won't be able to, and everyone can now see the correct answers."
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete" : "Close quiz"}
        cancelLabel="Keep it"
        onConfirm={() => {
          const c = confirm;
          setConfirm(null);
          if (!c) return;
          if (c.kind === "delete") act(c.quizId, STAFF_API.quizDelete(c.quizId), "DELETE", "Quiz deleted.");
          else act(c.quizId, STAFF_API.quizClose(c.quizId), "POST", "Quiz closed. Students can now see the correct answers.");
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ── Writer ───────────────────────────────────────────────────────────────

const emptyQuestion = (): Question => ({ prompt: "", options: ["", "", "", ""], correct_index: null, explanation: "" });

function QuizWriter({ moduleId }: { moduleId: number }) {
  const nav = useQuizNav();
  const [loaded, setLoaded] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [questions, setQuestions] = useState<Question[]>(() => Array.from({ length: QUESTIONS }, emptyQuestion));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const apply = (q: Quiz | null, mTitle: string) => {
    setQuiz(q);
    setTitle(q?.title ?? `${mTitle} quiz`);
    setInstructions(q?.instructions ?? "");
    setTimeLimit(q?.time_limit_minutes ? String(q.time_limit_minutes) : "");
    setClosesAt(toLocalInput(q?.closes_at));
    if (q && q.questions.length) {
      setQuestions(
        q.questions.map((x) => ({ prompt: x.prompt, options: [...x.options], correct_index: x.correct_index, explanation: x.explanation ?? "" })),
      );
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetchStaff(STAFF_API.moduleQuiz(moduleId));
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg({ kind: "err", text: res.status === 402 ? "Quizzes are part of the Basic plan and above." : firstError(json, "Could not load this module.") });
        } else {
          setModuleTitle(json.module?.title ?? "");
          apply(json.quiz ?? null, json.module?.title ?? "Module");
        }
      } catch {
        setMsg({ kind: "err", text: "Could not load this module. Refresh to try again." });
      }
      setLoaded(true);
    })();
  }, [moduleId]);

  const locked = !!quiz?.taken;

  const update = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const save = async (publish: boolean) => {
    setMsg(null);
    // Trim empty trailing options; a question needs 2-4 filled options.
    const cleaned = questions.map((q) => {
      const filled = q.options.map((o) => o.trim());
      const keep = filled.map((o, idx) => ({ o, idx })).filter((x) => x.o !== "");
      const newCorrect = q.correct_index === null ? null : keep.findIndex((x) => x.idx === q.correct_index);
      return { prompt: q.prompt.trim(), options: keep.map((x) => x.o), correct_index: newCorrect === -1 ? null : newCorrect, explanation: q.explanation.trim() };
    });
    const problem = cleaned.findIndex((q) => !q.prompt || q.options.length < 2 || q.correct_index === null);
    if (problem !== -1) {
      const q = cleaned[problem];
      setMsg({
        kind: "err",
        text: `Question ${problem + 1}: ${!q.prompt ? "write the question" : q.options.length < 2 ? "give at least 2 answer options" : "pick the correct answer"}.`,
      });
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetchStaff(STAFF_API.moduleQuiz(moduleId), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim() || null,
          time_limit_minutes: timeLimit ? Number(timeLimit) : null,
          closes_at: closesAt ? new Date(closesAt).toISOString() : null,
          questions: cleaned.map((q) => ({ ...q, explanation: q.explanation || null })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: firstError(json, "Could not save the quiz.") });
        return;
      }
      apply(json.quiz, moduleTitle);

      if (publish && json.quiz?.status === "draft") {
        const pub = await apiFetchStaff(STAFF_API.quizPublish(json.quiz.id), { method: "POST", headers: { Accept: "application/json" } });
        const pj = await pub.json().catch(() => ({}));
        if (!pub.ok) {
          setMsg({ kind: "err", text: firstError(pj, "Saved, but could not publish.") });
          return;
        }
        nav.listPublished();
        return;
      }
      setMsg({ kind: "ok", text: "Quiz saved." });
    } catch {
      setMsg({ kind: "err", text: "Could not save the quiz. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <button type="button" onClick={nav.list} className="text-xs text-white/60 hover:text-white">← All quizzes</button>
        <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {quiz ? "Edit quiz" : "Write a quiz"}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {moduleTitle} · {QUESTIONS} questions, each with 2 to 4 answers and one correct answer.
        </p>
      </div>

      {msg ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/25 bg-amber-400/10 text-amber-100"}`}>
          {msg.text}
        </div>
      ) : null}

      {locked ? (
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          Students have already taken this quiz, so the questions and time limit are locked (their scores depend on them). You can
          still change the title, instructions and close date.
        </div>
      ) : null}

      <div className="grid gap-4 rounded-2xl border border-white/15 bg-black/30 p-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Title</span>
          <input className={inputClass} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Instructions (optional)</span>
          <textarea className={inputClass} rows={2} value={instructions} maxLength={2000} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Answer from what we covered in this module." />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Time limit</span>
          <select className={inputClass} value={timeLimit} disabled={locked} onChange={(e) => setTimeLimit(e.target.value)}>
            <option value="">No time limit</option>
            {[5, 10, 15, 20, 30].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Closes (optional)</span>
          <input type="datetime-local" className={inputClass} value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          <span className="mt-1 block text-[11px] text-white/40">Correct answers are shown to students once it closes.</span>
        </label>
      </div>

      {questions.map((q, i) => (
        <fieldset key={i} disabled={locked} className="space-y-3 rounded-2xl border border-white/15 bg-black/30 p-5 disabled:opacity-80">
          <legend className="px-1 text-sm font-semibold text-white">Question {i + 1}</legend>
          <textarea className={inputClass} rows={2} value={q.prompt} maxLength={1000} placeholder="Type the question" onChange={(e) => update(i, { prompt: e.target.value })} />
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${i}`}
                  checked={q.correct_index === oi}
                  onChange={() => update(i, { correct_index: oi })}
                  className="h-4 w-4 shrink-0 accent-emerald-500"
                  aria-label={`Answer ${oi + 1} is correct`}
                />
                <input
                  className={inputClass}
                  value={opt}
                  maxLength={300}
                  placeholder={`Answer ${oi + 1}${oi >= 2 ? " (optional)" : ""}`}
                  onChange={(e) => update(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                />
              </div>
            ))}
            <p className="text-[11px] text-white/40">Tick the circle next to the correct answer. Leave answers 3 and 4 empty if you only need 2.</p>
          </div>
          <input className={inputClass} value={q.explanation} maxLength={1000} placeholder="Why it's correct (optional, shown after the quiz closes)" onChange={(e) => update(i, { explanation: e.target.value })} />
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={() => save(false)} className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40 disabled:opacity-50">
          {saving ? "Saving…" : quiz?.status === "published" ? "Save changes" : "Save draft"}
        </button>
        {quiz?.status !== "published" ? (
          <button type="button" disabled={saving} onClick={() => save(true)} className="rounded-lg bg-site-primary px-5 py-2.5 text-sm font-semibold text-[#fff] hover:brightness-110 disabled:opacity-50">
            Save &amp; publish
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Results ──────────────────────────────────────────────────────────────

function QuizResults({ quizId }: { quizId: number }) {
  const nav = useQuizNav();
  const [data, setData] = useState<{ quiz: Quiz; scoreboard: ScoreRow[]; in_progress: number; enrolled: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetchStaff(STAFF_API.quizResults(quizId));
        const json = await res.json().catch(() => ({}));
        if (!res.ok) setError(firstError(json, "Could not load the results."));
        else setData(json);
      } catch {
        setError("Could not load the results. Refresh to try again.");
      }
    })();
  }, [quizId]);

  if (error) return <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>;
  if (!data) return <LoadingSpinner />;

  const taken = data.scoreboard.length;
  const avg = taken ? (data.scoreboard.reduce((s, r) => s + r.score, 0) / taken).toFixed(1) : null;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <button type="button" onClick={nav.list} className="text-xs text-white/60 hover:text-white">← All quizzes</button>
        <h1 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{data.quiz.title}</h1>
        <p className="mt-1 text-sm text-white/60">
          {data.quiz.closed ? "Closed" : data.quiz.closes_at ? `Closes ${fmtDate(data.quiz.closes_at)}` : "Open"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Taken", `${taken}/${data.enrolled}`],
          ["In progress", String(data.in_progress)],
          ["Average", avg ? `${avg}/${QUESTIONS}` : "-"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-white/15 bg-black/30 p-4">
            <p className="truncate text-xs uppercase tracking-wide text-white/50">{label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Scoreboard</h2>
        <Scoreboard rows={data.scoreboard} />
        <p className="mt-2 text-xs text-white/45">
          Ranked by score, then by who finished faster. Students see first names and last initials only.
        </p>
      </section>
    </div>
  );
}
