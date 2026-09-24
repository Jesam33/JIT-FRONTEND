import type { LifecycleState } from "./AccountDangerZone";

/**
 * One badge per lifecycle state, shared by the owner's student and staff rosters.
 *
 * The roster has to say WHICH kind of off a person is, because the three are not
 * interchangeable to the person reading the table: a suspended account is one
 * click from coming back, one whose deletion is scheduled is counting down and
 * will not come back on its own, and a purged one is gone for good. A single
 * "Inactive" label would flatten all three into the same reassuring word.
 */
export function lifecycleLabel(state: LifecycleState, purgeAfter: string | null): {
  text: string;
  className: string;
} {
  switch (state) {
    case "deactivated":
      return { text: "Suspended", className: "bg-amber-500/15 text-amber-300" };
    case "purge_scheduled":
      return {
        text: purgeAfter ? `Deleting ${formatShort(purgeAfter)}` : "Deleting",
        className: "bg-red-500/15 text-red-300",
      };
    case "purged":
      return { text: "Deleted", className: "bg-white/10 text-white/50" };
    default:
      return { text: "Active", className: "bg-emerald-500/15 text-emerald-300" };
  }
}

function formatShort(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** The badge itself, so a roster cell stays a one-liner. */
export function LifecycleBadge({ state, purgeAfter }: { state: LifecycleState; purgeAfter: string | null }) {
  const { text, className } = lifecycleLabel(state, purgeAfter);
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>
      {text}
    </span>
  );
}
