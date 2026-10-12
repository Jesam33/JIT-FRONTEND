// The "Verified reviews" section of a public course page. Every review here
// was written by a student the platform saw learn (attended classes, completed
// tasks/quizzes, or finished), and says so: the proof line under each review.
// Shows the star breakdown, the reviews, and the academy's replies.
// Data: PublicInstituteController::verifiedReviews.

import StarRating from "@/components/ui/StarRating";

export type PublicReview = {
  id: number;
  name: string;
  rating: number;
  comment: string | null;
  proof: string;
  finished: boolean;
  reply: string | null;
  replied_at: string | null;
  date: string | null;
};

export type CourseReviewsData = {
  breakdown: Record<string, number>;
  items: PublicReview[];
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CourseReviews({
  reviews,
  average,
  count,
  instituteName,
}: {
  reviews?: CourseReviewsData | null;
  average: number;
  count: number;
  instituteName: string;
}) {
  if (!reviews || count === 0) return null;

  const stars = [5, 4, 3, 2, 1];

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Verified reviews
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
          <ShieldCheck /> Only from students who took this course
        </span>
      </div>

      {/* Summary: the average and how the stars are spread. */}
      <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:pr-4 sm:text-left">
          <p className="text-4xl font-bold text-white">{average.toFixed(1)}</p>
          <StarRating value={average} size="md" hideValue />
          <p className="mt-1 text-xs text-white/55">
            {count} verified review{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-1.5">
          {stars.map((s) => {
            const n = reviews.breakdown[String(s)] ?? 0;
            const pct = count > 0 ? Math.round((n / count) * 100) : 0;
            return (
              <div key={s} className="flex items-center gap-3 text-xs text-white/60">
                <span className="w-6 shrink-0 tabular-nums">{s}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.items.map((r) => (
          <li key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/80" aria-hidden="true">
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <StarRating value={r.rating} size="sm" hideValue />
                </div>
              </div>
              <span className="text-xs text-white/40">{fmtDate(r.date)}</span>
            </div>

            {r.proof ? (
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300/90">
                <ShieldCheck /> Verified learner · {r.proof}
              </p>
            ) : null}

            {r.comment ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{r.comment}</p> : null}

            {r.reply ? (
              <div className="mt-3 rounded-lg border-l-2 border-[color:var(--color-primary)] bg-white/[0.04] px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Reply from {instituteName}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-white/75">{r.reply}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
