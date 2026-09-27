// Admission Marketer referral links.
//
// An agent shares a LINK (the academy's public address with ?ref=CODE appended),
// not just a code. The code has to survive the visitor browsing the storefront
// before they reach a registration form, which can be several page loads later,
// so it is stashed on arrival and read back by the registration form, which
// prefills the (still editable, still optional) referral field.
//
// Scoped PER ACADEMY: a visitor who follows two agents' links to two different
// academies must not carry the first academy's code into the second one's form.
//
// Best-effort throughout. localStorage can be unavailable or throw (private
// windows, blocked site data, previews), and the failure mode is only that the
// field is not prefilled, so every access is guarded.

const PREFIX = "lms_referral_";

// Longer than any enrolment journey, short enough that a code from months ago
// cannot silently attribute a new student to whoever happened to be first.
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

type Stored = { code: string; at: number };

// Codes are compared case-insensitively by the backend and are always generated
// uppercase, so normalising here keeps a hand-typed ?ref=agent-abc matching the
// stored one.
function normalise(raw: string | null | undefined): string {
  return (raw ?? "").trim().toUpperCase();
}

function key(slug?: string | null): string {
  return PREFIX + (slug || "_");
}

/** The code in the current URL's ?ref=, or "" when there is none. */
export function referralFromLocation(): string {
  if (typeof window === "undefined") return "";
  try {
    return normalise(new URL(window.location.href).searchParams.get("ref"));
  } catch {
    return "";
  }
}

/**
 * Remember the ?ref= code this visit arrived with. Called once from the
 * storefront layout, which wraps the academy's landing page AND its course
 * pages, so a shared course link is captured the same way as an academy link.
 */
export function captureReferral(slug?: string | null): void {
  const code = referralFromLocation();
  if (!code) return;

  try {
    window.localStorage.setItem(key(slug), JSON.stringify({ code, at: Date.now() } satisfies Stored));
  } catch {
    /* storage unavailable: the URL itself still carries the code on this page */
  }
}

/** The remembered code for this academy, or "" when there is none / it expired. */
export function storedReferral(slug?: string | null): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return "";

    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.code || typeof parsed.at !== "number") return "";
    if (Date.now() - parsed.at > MAX_AGE_MS) {
      window.localStorage.removeItem(key(slug));
      return "";
    }

    return normalise(parsed.code);
  } catch {
    return "";
  }
}

/**
 * The code to prefill the registration form with: the one remembered for this
 * academy, else one in the current URL (which covers landing straight on a
 * course page from a shared link). "" when neither is present.
 */
export function referralCodeFor(slug?: string | null): string {
  return storedReferral(slug) || referralFromLocation();
}
