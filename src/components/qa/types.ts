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
  /** The academy behind the event, for the "<academy> x Jorsas Tech" lockup. */
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

/** The display name for the co-branding: the academy, or iungo for the first event. */
export function qaBrandName(event: QaEventInfo | null | undefined): string {
  return event?.brand_name?.trim() || "iungo";
}

/** A locale date for the event header, or "" when there is no usable date. */
export function qaPrettyDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
