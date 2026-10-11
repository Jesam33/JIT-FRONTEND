"use client";

// A quiz scoreboard: everyone who has finished, ranked by score then speed.
// Columns: rank (medals for 1st to 3rd), student, time, score with a small
// bar. The top 5 are set apart from the rest by a divider, and the viewer's
// own row is tinted and tagged "You". Shared by the student quiz page and the
// teacher's results view.

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  total: number;
  percent: number;
  duration_seconds: number;
  top: boolean;
  you?: boolean;
};

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Avatar tints for the podium; everyone else gets a neutral one.
const PODIUM_AVATAR: Record<number, string> = {
  1: "bg-amber-400/20 text-amber-200",
  2: "bg-slate-300/20 text-slate-200",
  3: "bg-orange-500/20 text-orange-200",
};

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function barTone(percent: number): string {
  if (percent >= 80) return "bg-emerald-400";
  if (percent >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

const COLS = "grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[2rem_minmax(0,1fr)_4.5rem_5rem]";

export default function Scoreboard({ rows, emptyText = "Nobody has finished this quiz yet." }: { rows: ScoreRow[]; emptyText?: string }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/55">{emptyText}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className={`${COLS} border-b border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white/40`}>
        <span className="text-center">#</span>
        <span>Student</span>
        <span className="hidden text-right sm:block">Time</span>
        <span className="text-right">Score</span>
      </div>

      <ol>
        {rows.map((r, i) => {
          const afterTop = i > 0 && rows[i - 1].top && !r.top;
          return (
            <li
              key={`${r.rank}-${r.name}`}
              className={`${COLS} px-4 py-3 text-sm ${afterTop ? "border-t border-dashed border-white/15" : i > 0 ? "border-t border-white/[0.06]" : ""} ${
                r.you ? "bg-site-primary/10" : ""
              }`}
            >
              <span className="flex justify-center" aria-label={`Rank ${r.rank}`}>
                {MEDALS[r.rank] ? (
                  <span className="text-xl leading-none">{MEDALS[r.rank]}</span>
                ) : (
                  <span className={`text-sm font-semibold tabular-nums ${r.top ? "text-amber-200" : "text-white/45"}`}>{r.rank}</span>
                )}
              </span>

              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    PODIUM_AVATAR[r.rank] ?? "bg-white/10 text-white/70"
                  }`}
                  aria-hidden="true"
                >
                  {initials(r.name)}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={`truncate ${r.top ? "font-semibold text-white" : "text-white/85"}`}>{r.name}</span>
                    {r.you ? (
                      <span className="shrink-0 rounded-full bg-site-primary px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[#fff]">You</span>
                    ) : null}
                  </span>
                  {/* Time sits under the name on phones, in its own column from sm up. */}
                  <span className="block text-xs tabular-nums text-white/45 sm:hidden">{formatDuration(r.duration_seconds)}</span>
                </span>
              </span>

              <span className="hidden text-right text-xs tabular-nums text-white/50 sm:block">{formatDuration(r.duration_seconds)}</span>

              <span className="flex flex-col items-end gap-1">
                <span className="font-semibold tabular-nums text-white">
                  {r.score}
                  <span className="text-white/40">/{r.total}</span>
                </span>
                <span className="h-1 w-14 overflow-hidden rounded-full bg-white/10" aria-label={`${r.percent}%`}>
                  <span className={`block h-full rounded-full ${barTone(r.percent)}`} style={{ width: `${r.percent}%` }} />
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
