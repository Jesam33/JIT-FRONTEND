// The "Reviews" card on a public course page. Every review here was written by
// a student the platform saw learn (attended classes, completed tasks/quizzes,
// or finished), and says so: the proof line under each review. One compact
// rating line at the top; the star breakdown only appears once there are
// enough reviews for it to mean something. The academy's replies sit under the
// review they answer. Data: PublicInstituteController::verifiedReviews.

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

// Fewer than this and a 5-star breakdown is just "100% / 0% / 0%…".
const BREAKDOWN_FROM = 5;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

export function ShieldCheck({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`} aria-hidden="true">
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

  return (
    <section id="reviews" className="scroll-mt-24 rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Student reviews
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/70">
            <StarRating value={average} size="sm" hideValue />
            <span className="font-semibold text-white">{average.toFixed(1)}</span>
            <span>
              · {count} review{count === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          <ShieldCheck /> Only from students who took this course
        </span>
      </div>

      {count >= BREAKDOWN_FROM ? (
        <div className="mt-5 max-w-sm space-y-1.5">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = reviews.breakdown[String(s)] ?? 0;
            const pct = Math.round((n / count) * 100);
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
      ) : null}

      <ul className="mt-6 divide-y divide-white/10">
        {reviews.items.map((r) => (
          <li key={r.id} className="py-5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#fff]"
                style={{ background: "color-mix(in srgb, var(--color-primary) 70%, #000)" }}
                aria-hidden="true"
              >
                {r.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <span className="text-xs text-white/40">{fmtDate(r.date)}</span>
                </div>
                <div className="mt-1">
                  <StarRating value={r.rating} size="sm" hideValue />
                </div>
                {r.comment ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{r.comment}</p> : null}
                {r.proof ? (
                  <p className="mt-2 inline-flex items-start gap-1 text-[11px] text-emerald-300/90">
                    <ShieldCheck className="mt-px h-3.5 w-3.5" /> Verified learner · {r.proof}
                  </p>
                ) : null}
                {r.reply ? (
                  <div className="mt-3 rounded-lg border-l-2 border-[color:var(--color-primary)] bg-white/[0.04] px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Reply from {instituteName}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-white/75">{r.reply}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
