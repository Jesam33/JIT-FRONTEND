"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * "Help us make the app better" — the floating Feedback entry point and its
 * modal, shared by all four portals.
 *
 * The same component in every portal because the form is the same form; what
 * differs is only how the request is authenticated, so that is the one thing the
 * caller supplies (`submit`). Each portal hands in a closure built on its own
 * fetch helper, which keeps this file free of every portal's auth module.
 *
 * The backend resolves the author and the academy from the session bearer token,
 * never from this payload — the only thing sent here is the category, the
 * message, and the path the sender was on. `page` is what makes a report
 * reproducible, so it is filled from the live route rather than asked for.
 */

export type FeedbackSubmission = {
  category: string;
  message: string;
  page: string;
};

/** Keys must match App\Models\Feedback::CATEGORIES. */
export const FEEDBACK_CATEGORIES: { key: string; label: string }[] = [
  { key: "problem", label: "Something is not working" },
  { key: "idea", label: "An idea for something new" },
  { key: "confusing", label: "Something is confusing" },
  { key: "other", label: "Something else" },
];

// Matches the backend rule (min:10). Checked here so the sender is told before
// the round trip, not after.
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

type Props = {
  /** POSTs the payload with this portal's credentials. Reject to surface an error. */
  submit: (payload: FeedbackSubmission) => Promise<void>;
  /**
   * Which surface the pill and panel are painted on. "glass" is the dark chrome
   * the student, staff and owner portals use; "surface" follows the site tokens
   * the agent portal is themed with.
   */
  tone?: "glass" | "surface";
};

export default function FeedbackButton({ submit, tone = "glass" }: Props) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0].key);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Reset only on close, not on every keystroke: a half-written message must
    // survive an accidental backdrop click that reopens a moment later.
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    // Focus the field the person came here to fill in.
    const t = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, close]);

  // A fresh visit to the form: the previous "thank you" was for a previous
  // message.
  const openForm = () => {
    setSent(false);
    setError(null);
    setOpen(true);
  };

  const trimmed = message.trim();
  const tooShort = trimmed.length < MIN_MESSAGE;
  const remaining = MAX_MESSAGE - message.length;

  const send = async () => {
    if (tooShort || sending) return;
    setSending(true);
    setError(null);
    try {
      await submit({ category, message: trimmed, page: pathname });
      setSent(true);
      setMessage("");
    } catch {
      setError("That did not send. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const glass = tone === "glass";

  const pill = glass
    ? "border-white/15 bg-[#0b0b0b]/90 text-white/80 hover:bg-white/10 [html.light_&]:border-site-border [html.light_&]:bg-site-surface [html.light_&]:text-black/80 [html.light_&]:hover:bg-black/5"
    : "border-site-border bg-site-surface text-site-text/70 hover:bg-site-surface-soft";

  const panel = glass
    ? "border-white/15 bg-[#0b0b0b] text-white [html.light_&]:border-site-border [html.light_&]:bg-white [html.light_&]:text-black"
    : "border-site-border bg-site-surface text-site-text";

  const field = glass
    ? "border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:border-white/40 [html.light_&]:border-site-border [html.light_&]:bg-white [html.light_&]:text-black [html.light_&]:placeholder:text-black/35"
    : "border-site-border bg-site-surface-soft text-site-text placeholder:text-site-text/35";

  const chip = (active: boolean) =>
    glass
      ? `rounded-lg border px-3 py-1.5 text-xs transition ${
          active
            ? "border-site-primary bg-site-primary font-semibold text-[#fff]"
            : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 [html.light_&]:border-site-border [html.light_&]:text-black/70 [html.light_&]:hover:bg-black/5"
        }`
      : `rounded-lg border px-3 py-1.5 text-xs transition ${
          active
            ? "border-site-primary bg-site-primary font-semibold text-[#fff]"
            : "border-site-border bg-site-surface-soft text-site-text/70"
        }`;

  const muted = glass ? "text-white/50 [html.light_&]:text-black/50" : "text-site-text/50";
  const secondaryBtn = glass
    ? "rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 [html.light_&]:border-site-border [html.light_&]:text-black/70 [html.light_&]:hover:bg-black/5"
    : "rounded-lg border border-site-border px-4 py-2 text-sm text-site-text/70 transition hover:bg-site-surface-soft";

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        aria-label="Send feedback"
        title="Send feedback"
        // max-sm lifts the pill clear of AppInstallPrompt, which sits bottom-centre
        // at the same offset on a phone and would otherwise sit underneath it.
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur transition max-sm:bottom-24 print:hidden ${pill}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
        </svg>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-4 sm:items-center print:hidden"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${panel}`}
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <>
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Thank you
                </h3>
                <p className={`mt-2 text-sm ${muted}`}>
                  Your feedback has been sent to the Jorsas Tech team. Nothing else is needed from you.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={openForm}
                    className="rounded-lg bg-site-primary px-4 py-2 text-sm font-semibold text-[#fff] transition hover:opacity-90"
                  >
                    Send another
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Help us make the app better
                </h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  Tell us what is working, what is not, or what you wish the portal did.
                </p>

                <div className="mt-5">
                  <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${muted}`}>
                    What is this about?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        aria-pressed={category === c.key}
                        className={chip(category === c.key)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="feedback-message" className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] ${muted}`}>
                    Your message
                  </label>
                  <textarea
                    id="feedback-message"
                    ref={textareaRef}
                    rows={5}
                    maxLength={MAX_MESSAGE}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="The more detail, the more we can do with it."
                    className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition ${field}`}
                  />
                  <div className={`mt-1 flex items-center justify-between text-[11px] ${muted}`}>
                    <span>
                      {tooShort
                        ? `At least ${MIN_MESSAGE} characters, please.`
                        : "We read every one of these."}
                    </span>
                    {/* Only once it matters, so the counter is not permanent noise. */}
                    {remaining < MAX_MESSAGE * 0.2 && <span>{remaining} left</span>}
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}

                {/* Says plainly where this goes. A form that silently posts into
                    an academy's own dashboard would be a different promise. */}
                <p className={`mt-4 text-[11px] leading-relaxed ${muted}`}>
                  This goes to the Jorsas Tech team, along with the page you were on
                  {pathname ? ` (${pathname})` : ""} and your account. Your academy is not shown this form.
                </p>

                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={close} className={secondaryBtn}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={tooShort || sending}
                    className="rounded-lg bg-site-primary px-4 py-2 text-sm font-semibold text-[#fff] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send feedback"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
