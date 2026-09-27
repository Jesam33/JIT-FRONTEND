// The shapes the three public QA endpoints return, shared by the signup page,
// the signup popup on the marketing site, and the room. All three call
// `slotPayload()` / `eventPayload()` server-side, so these are one shape each,
// not three variations: declaring them per-file is how they drift.

export type QaSlotInfo = {
  id: number;
  label: string;
  /** Human window, e.g. "10:00 - 11:30". Falls back to the label. */
  window: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  taken: number;
  /** null when the room is uncapped. */
  remaining: number | null;
  is_open: boolean;
};

export type QaEventInfo = {
  slug: string;
  name: string;
  blurb: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_open: boolean;
  /** The academy behind the event. Shown on its own; see qaBrandName(). */
  brand_name: string | null;
};

/** What a room token exchange returns, for both a tester and a host. */
export type QaRoomInfo = {
  room: string;
  jwt: string;
  domain: string;
  app_id: string;
  user_name: string;
  moderator: boolean;
  event: QaEventInfo;
  slot: QaSlotInfo;
};

/** Whose testing this is: the academy behind the event, or iungo as the fallback. */
export function qaBrandName(event: QaEventInfo | null | undefined): string {
  return event?.brand_name?.trim() || "iungo";
}

/**
 * The small print under the brand.
 *
 * The brand is shown alone rather than in a "<brand> x Jorsas Tech" lockup.
 * Testers are not Jorsas customers and were never asked to deal with two
 * companies; the lockup implied they were. The relationship goes here instead,
 * once, small.
 *
 * iungo is Jorsas Tech's own product, so it gets the ownership line. An academy's
 * event is a service Jorsas runs FOR them, which is a different claim and gets
 * different words: saying an academy "is a product of Jorsas Tech" would be false.
 */
export function qaParentNotice(event: QaEventInfo | null | undefined): string {
  return qaBrandName(event).toLowerCase() === "iungo"
    ? "iungo is a product of Jorsas Tech"
    : "A Jorsas Tech testing session";
}

/** A locale date for the event header, or "" when there is no usable date. */
export function qaPrettyDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
