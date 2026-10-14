// Times in notifications, in the reader's own timezone.
//
// The server never writes a ready-made time into notification text (one
// notification is read by people in different timezones). It writes a marker,
// "[[time:2026-10-14T21:50:00Z|time]]", which this turns into the time on THIS
// device's clock. Emails do the same server-side (App\Support\LocalTime) with
// the timezone the portal reports in the X-Timezone header (deviceTimezone()).
//
// Styles: datetime "Wed 14 Oct, 10:50 PM WAT" · time "10:50 PM WAT" ·
// date "14 Oct" · weekly "Wednesday at 10:50 PM WAT".

const MARKER = /\[\[time:([0-9T:\-+.Z]+)\|(datetime|time|date|weekly)\]\]/g;

/** This device's IANA timezone, e.g. "Europe/London" ("" if the browser can't say). */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function format(d: Date, style: string): string {
  const time: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", timeZoneName: "short" };
  switch (style) {
    case "time":
      return d.toLocaleTimeString(undefined, time);
    case "date":
      return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    case "weekly":
      return `${d.toLocaleDateString(undefined, { weekday: "long" })} at ${d.toLocaleTimeString(undefined, time)}`;
    default:
      return d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", ...time });
  }
}

/** Replace every time marker in notification text with the local time. */
export function renderTimes(text: string | null | undefined): string {
  if (!text) return "";
  if (!text.includes("[[time:")) return text;
  return text.replace(MARKER, (whole, iso: string, style: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? whole : format(d, style);
  });
}
