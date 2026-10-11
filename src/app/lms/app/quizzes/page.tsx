"use client";

// The student's module quizzes: one per module, 5 questions each, one attempt.
// Each card opens /lms/app/quizzes/[id] to take it, see the score, and the
// class scoreboard. Backend: StudentQuizController@index (never 402s; on a
// plan without quizzes it answers available:false).

import { useEffect, useState } from "react";
import Link from "next/link";
import { STUDENT_API } from "@/lib/api";
import { apiFetch } from "@/lib/fetch-with-timeout";
import LoadingSpinner from "@/components/LoadingSpinner";

type QuizSummary = {
  id: number;
  title: string;
  module_title: string | null;
  questions: number;
  time_limit_minutes: number | null;
  closes_at: string | null;
  closed: boolean;
  state: "not_started" | "in_progress" | "submitted" | "closed";
  score: number | null;
  total: number | null;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function StudentQuizzesPage() {
  const [data, setData] = useState<{ available: boolean; quizzes: QuizSummary[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(STUDENT_API.quizzes);
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        setData({ available: !!json.available, quizzes: Array.isArray(json.quizzes) ? json.quizzes : [] });
      } catch {
        setError(true);
        setData({ available: true, quizzes: [] });
      }
    })();
  }, []);

  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Quizzes</h1>
        <p className="mt-1 text-sm text-white/60">
          A short quiz after each module. You get one try, your score shows straight away, and the top 5 make the scoreboard.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Couldn&apos;t load your quizzes. Refresh the page to try again.
        </div>
      ) : null}

      {!data.available ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center text-sm text-white/70">
          Quizzes aren&apos;t switched on for your academy yet.
        </div>
      ) : data.quizzes.length === 0 && !error ? (
        <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center">
          <p className="text-sm text-white/70">No quizzes yet.</p>
          <p className="mt-1 text-xs text-white/50">When your teacher publishes a quiz for a module, it appears here and you get a notification.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.quizzes.map((q) => {
            const badge =
              q.state === "submitted"
                ? { text: `${q.score}/${q.total}`, tone: "bg-emerald-500/15 text-emerald-300" }
                : q.state === "in_progress"
                  ? { text: "In progress", tone: "bg-amber-500/15 text-amber-300" }
                  : q.state === "closed"
                    ? { text: "Missed", tone: "bg-white/10 text-white/60" }
                    : { text: "New", tone: "bg-site-primary/25 text-white" };
            const cta =
              q.state === "submitted" || q.state === "closed" ? "See scoreboard" : q.state === "in_progress" ? "Continue" : "Take quiz";

            return (
              <Link
                key={q.id}
                href={`/lms/app/quizzes/${q.id}`}
                className="group flex flex-col rounded-2xl border border-white/15 bg-black/30 p-5 transition hover:border-white/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {q.module_title ? <p className="truncate text-xs uppercase tracking-wide text-white/45">{q.module_title}</p> : null}
                    <p className="mt-0.5 font-semibold text-white">{q.title}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.tone}`}>{badge.text}</span>
                </div>
                <p className="mt-3 text-xs text-white/50">
                  {q.questions} questions
                  {q.time_limit_minutes ? ` · ${q.time_limit_minutes} min` : ""}
                  {q.closes_at && !q.closed ? ` · closes ${fmtDate(q.closes_at)}` : ""}
                  {q.closed ? " · closed" : ""}
                </p>
                <span className="mt-4 text-sm font-semibold text-white/80 group-hover:text-white">{cta} →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
