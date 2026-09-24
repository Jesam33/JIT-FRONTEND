"use client";

import { useEffect, useState } from "react";
import { QA_API } from "@/lib/api";
import type { QaSlotInfo } from "./types";

// The tester signup form: pick a session, give a name, an email and a phone
// number, get a join link. Shared by the standalone page at /qa/{event} and by
// the popup on the marketing site, because they ask for exactly the same thing
// and two copies would drift on the first change to either.
//
// The form owns the fields and the submit; the caller owns the frame around it
// (a page, a modal), what happens once it succeeds, and what to do when the
// session list turns out to be stale.

type Props = {
  slug: string;
  /** The sessions currently open. Re-read by the caller after a failed submit. */
  slots: QaSlotInfo[];
  /** The server accepted the registration; carries the address to confirm to. */
  onDone: (email: string) => void;
  /**
   * Re-read the event: the picked session was taken between load and submit.
   *
   * The result is awaited and discarded, so callers may return whatever their own
   * reload happens to produce (the page's returns whether the event loaded, the
   * popup's returns whether it should still be showing). Typing this `void` forced
   * a pointless wrapper at every call site.
   */
  onReload: () => Promise<unknown> | void;
  /** The event itself closed between load and submit. */
  onClosed: () => void;
};

export default function QaSignupForm({ slug, slots, onDone, onReload, onClosed }: Props) {
  const [slotId, setSlotId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  // Keeps the pick honest as `slots` changes underneath: an initial pre-pick when
  // there is only one choice, a repair when the picked session is gone, and no
  // change at all when it survived. Runs on every new list, which is what makes
  // the reload-after-taken-session path land on something selectable.
  useEffect(() => {
    setSlotId((current) => {
      if (current && slots.some((s) => s.id === current)) return current;
      return slots.length === 1 ? slots[0].id : null;
    });
  }, [slots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!slotId) {
      setFormError("Pick a session to continue.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFormError("Name, email and phone are all needed.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(QA_API.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          slot_id: slotId,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        onDone(email.trim());
        return;
      }

      // A session that filled up between page load and submit is worth re-reading
      // rather than only reporting: the picker is showing a session that is no
      // longer open, and the next move is to choose another one.
      if (data?.slot_invalid) {
        setFormError(data.message ?? "That session is no longer open. Pick another.");
        await onReload();
        return;
      }
      if (data?.closed) {
        onClosed();
        return;
      }
      setFormError(data?.message ?? "That did not go through. Please try again.");
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-site-muted">Choose a session</h2>

        {slots.length === 0 ? (
          <p className="mt-3 text-sm text-site-muted">
            Every session is currently full. Please check back, or contact the team who invited you.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {slots.map((s) => {
              const full = s.remaining !== null && s.remaining <= 0;
              const active = slotId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={full}
                  onClick={() => setSlotId(s.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    active ? "border-site-primary bg-site-primary/10" : "border-site-border hover:border-site-muted"
                  } ${full ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{s.label}</span>
                    {s.window ? <span className="mt-0.5 block text-xs text-site-muted">{s.window}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-site-muted">
                    {full ? "Full" : s.remaining !== null ? `${s.remaining} places left` : "Open"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-site-muted">Your details</h2>

        <div className="mt-3 space-y-4">
          <Field label="Full name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              required
              className="w-full rounded-xl border border-site-border bg-transparent px-4 py-3 text-sm outline-none focus:border-site-primary"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={190}
              required
              className="w-full rounded-xl border border-site-border bg-transparent px-4 py-3 text-sm outline-none focus:border-site-primary"
            />
            <p className="mt-1.5 text-xs text-site-muted">Your join link goes here, so please check the spelling.</p>
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              maxLength={40}
              required
              className="w-full rounded-xl border border-site-border bg-transparent px-4 py-3 text-sm outline-none focus:border-site-primary"
            />
            <p className="mt-1.5 text-xs text-site-muted">So the team can reach you if your link does not arrive on the day.</p>
          </Field>
        </div>
      </div>

      {formError ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{formError}</p>
      ) : null}

      <button
        type="submit"
        disabled={sending || slots.length === 0}
        className="w-full rounded-full bg-site-primary px-6 py-3.5 text-sm font-semibold text-[#fff] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Sending your link..." : "Send me my join link"}
      </button>

      <p className="text-center text-xs text-site-muted">We use your details only to run this testing session.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
