"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The account lifecycle controls: deactivate, delete, reactivate.
 *
 * One component for the student profile, the staff profile and the owner's own
 * academy page, because the three do the same thing and the only difference that
 * matters is which endpoints they call and which nouns the copy uses. Sharing it
 * is also the only way the wording stays honest: the three verbs mean exactly the
 * same thing everywhere, and a second copy would drift.
 *
 * What the verbs mean, and why the copy is this insistent about it:
 *
 *   Deactivate  access is frozen, nothing at all is deleted, one click undoes it.
 *   Delete      access is frozen NOW and the account is erased for real on a date
 *               30 days out. Everything stays intact and restorable until then.
 *               This is not a soft delete that a developer quietly turns back on;
 *               it is a countdown, and the person is told the date.
 *
 * A frozen account is refused by the API everywhere except the two endpoints that
 * undo it, so once this succeeds the rest of the portal stops answering. That is
 * why a frozen state renders as a full cover panel rather than an inline card:
 * there is nothing else on the page that still works, and leaving the person
 * looking at a half-dead profile would read as a broken site rather than a
 * deliberate state they can step back out of.
 */

export type LifecycleState = "active" | "deactivated" | "purge_scheduled" | "purged";

export type LifecycleInfo = {
  state: LifecycleState;
  deactivated_at: string | null;
  purge_after: string | null;
  purge_window_days: number;
  /**
   * Whether this account may be erased at all. Absent on the academy payload
   * (and defaults to true, so an older response still renders the button). A
   * student with a successful payment on record gets `false` here and the
   * Delete card becomes a pointer at the rights-request form instead — see
   * delete_blocked_reason for the sentence to show.
   */
  can_delete?: boolean;
  delete_blocked_reason?: string | null;
};

type Endpoints = {
  show: string;
  deactivate: string;
  reactivate: string;
  cancelDeletion: string;
  /** Absent for an academy: only the platform closes one permanently. */
  remove?: string;
};

type Props = {
  endpoints: Endpoints;
  /** Which fetch to use: the student token, or the staff/owner token. */
  fetcher: (url: string, options?: RequestInit) => Promise<Response>;
  /** "account" for a person, "academy" for the owner's whole institute. */
  scope?: "account" | "academy";
  /** Shown in the copy so the person knows which account they are acting on. */
  subject?: string;
  /**
   * What to do about an account that cannot be deleted from here (a student
   * with payments on record). The profile page passes a callback that opens its
   * Help & privacy tab, which is where the erasure request lives — a callback
   * rather than a link because that tab is on the page this card is already on.
   * Omitted for an academy, which has its own "contact support" copy.
   */
  onRequestErasure?: () => void;
  /** Called after a successful state change, so a parent can refetch. */
  onChanged?: (state: LifecycleState) => void;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountDangerZone({ endpoints, fetcher, scope = "account", subject, onRequestErasure, onChanged }: Props) {
  const [info, setInfo] = useState<LifecycleInfo | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");

  const isAcademy = scope === "academy";

  const load = useCallback(async () => {
    try {
      const res = await fetcher(endpoints.show);
      if (!res.ok) return;
      const data = await res.json();
      // The owner endpoint returns the lifecycle block at the top level; the
      // person endpoints nest it under `lifecycle`.
      const block: LifecycleInfo | undefined = data.lifecycle ?? data;
      if (block && block.state) setInfo(block);
    } catch {
      /* leave the state unknown; the actions below still work */
    }
  }, [endpoints.show, fetcher]);

  useEffect(() => { load(); }, [load]);

  async function act(kind: keyof Endpoints, body?: Record<string, unknown>) {
    const url = endpoints[kind];
    if (!url) return;

    setBusy(kind);
    setError("");
    setNotice("");
    try {
      const res = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? "That did not go through. Please try again.");
        // A delete refused because payments exist (422 + purge_blocked) means the
        // state on screen is stale — someone paid or was comped since this page
        // loaded. Refetch so the Delete card is replaced by the explanation
        // rather than left sitting there inviting a second click.
        if (data?.purge_blocked) await load();
        return;
      }
      const block: LifecycleInfo | undefined = data.lifecycle ?? data;
      if (block && block.state) {
        setInfo(block);
        onChanged?.(block.state);
      } else {
        await load();
      }
      setNotice(data?.message ?? "");
    } catch {
      setError("That did not go through. Please check your connection and try again.");
    } finally {
      setBusy("");
      setConfirmDelete(false);
      setTyped("");
    }
  }

  if (!info) return null;

  const noun = isAcademy ? "academy" : "account";
  // Two independent reasons the Delete card is not offered, and they are not the
  // same message to the same person:
  //
  //   an academy   the permanent closure is the platform's call (Jorsas, from the
  //                host admin), so the card is absent rather than pointing at
  //                something that would fail, and the copy says who to ask.
  //   paid student a successful payment is a financial record. The academy cannot
  //                erase the paying student and neither can the student — Jorsas
  //                decides, from the rights-request queue. So the card becomes a
  //                pointer at that form instead of a dead end.
  //
  // `can_delete` is reported by the API and never inferred here: the same rule
  // refuses the request server-side, so the button and the enforcement cannot
  // drift apart.
  const paymentBlocked = !isAcademy && info.can_delete === false;
  const canDelete = !isAcademy && !paymentBlocked;

  // ---------------------------------------------------------------- FROZEN
  // Deactivated or counting down: the rest of the portal is refusing this person
  // right now, so this covers the page instead of sitting inside it.
  if (info.state === "deactivated" || info.state === "purge_scheduled") {
    const deleting = info.state === "purge_scheduled";
    return (
      <>
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/85 backdrop-blur-sm">
          <div className="mx-auto flex min-h-full max-w-lg items-center px-4 py-10">
            <div className={`w-full rounded-2xl border p-6 ${deleting ? "border-red-500/40 bg-[#160b0b]" : "border-amber-400/30 bg-[#141007]"}`}>
              <h2 className="text-lg font-semibold text-white">
                {deleting
                  ? isAcademy ? "This academy is scheduled to close" : "Your account is scheduled for deletion"
                  : isAcademy ? "This academy is offline" : "Your account is deactivated"}
              </h2>

              {deleting ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">
                    {isAcademy
                      ? `Your public page is hidden and no new students can register. Everything your academy holds is untouched until ${formatDate(info.purge_after)}, when it is closed permanently.`
                      : `You cannot sign in while this is scheduled. Everything on your record is untouched until ${formatDate(info.purge_after)}, when it is deleted for good.`}
                  </p>
                  <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white">
                    Restorable until <strong>{formatDate(info.purge_after)}</strong>. After that date it cannot be undone.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {isAcademy
                    ? "New students cannot register and your public page is hidden. Your students and staff still have full access, and nothing has been deleted."
                    : "Nothing has been deleted. You simply cannot sign in until this is switched back on."}
                </p>
              )}

              {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
              {notice ? <p className="mt-4 text-sm text-green-400">{notice}</p> : null}

              <div className="mt-5 flex flex-wrap gap-3">
                {deleting && !isAcademy ? (
                  <button
                    type="button"
                    onClick={() => act("cancelDeletion")}
                    disabled={busy !== ""}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                  >
                    {busy === "cancelDeletion" ? "Cancelling..." : "Cancel deletion"}
                  </button>
                ) : deleting && isAcademy ? (
                  // An academy's closure is the platform's to reverse, so there is
                  // no self-service undo to offer here.
                  <p className="text-sm text-white/60">
                    To reverse this, contact Jorsas support.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => act("reactivate")}
                    disabled={busy !== ""}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                  >
                    {busy === "reactivate" ? "Restoring..." : isAcademy ? "Bring my academy back online" : "Reactivate my account"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (info.state === "purged") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Account</h3>
        <p className="mt-3 text-sm text-white/60">
          This {noun} has been closed. There is nothing left to change here.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- ACTIVE
  return (
    <>
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-red-300">Deactivate or delete</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {canDelete
            ? "Two different things, and it is worth knowing which one you want."
            : isAcademy
              ? "Taking your academy offline is reversible, and nothing is deleted."
              : "Deactivating your account is reversible. Deleting it is not something you can do yourself — here is why, and what to do instead."}
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Deactivate</p>
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              {isAcademy
                ? "Your public page goes offline and no new students can register. Your students and staff keep full access to everything, and no record is touched. Switch it back on whenever you like."
                : "You are signed out and cannot sign in again until you switch this back on. Nothing is deleted, your courses and records stay exactly as they are, and you can undo it at any time."}
            </p>
            <button
              type="button"
              onClick={() => act("deactivate")}
              disabled={busy !== ""}
              className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition hover:border-white/40 disabled:opacity-50"
            >
              {busy === "deactivate" ? "Working..." : isAcademy ? "Take my academy offline" : "Deactivate my account"}
            </button>
          </div>

          {canDelete ? (
            <div className="rounded-lg border border-red-500/20 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Delete</p>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                {`You are signed out right away and the account is deleted for good ${info.purge_window_days} days later. Until then everything is untouched and you can change your mind.`}
              </p>
              <button
                type="button"
                onClick={() => { setTyped(""); setConfirmDelete(true); }}
                disabled={busy !== ""}
                className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                Delete my account
              </button>
            </div>
          ) : isAcademy ? (
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Closing the academy permanently</p>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                Permanently closing an academy is not something you can do from here, and it is not
                something that happens by accident either. If you want to close your academy for good,
                contact Jorsas support and they will walk you through it.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Delete</p>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                {info.delete_blocked_reason ??
                  "This account has payment records attached to it, so it cannot be deleted from here."}{" "}
                Payment records have to be kept, so erasing an account that has them is a decision
                Jorsas makes rather than one the academy or the account holder makes alone.
              </p>
              {onRequestErasure ? (
                <button
                  type="button"
                  onClick={onRequestErasure}
                  className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition hover:border-white/40"
                >
                  Request erasure instead
                </button>
              ) : null}
            </div>
          )}
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-green-400">{notice}</p> : null}
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0b0b0b] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white">
              {isAcademy ? "Close your academy" : "Delete your account"}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {isAcademy
                ? `Your academy goes offline immediately and is closed permanently ${info.purge_window_days} days from now. Until that date nothing is touched and you can cancel from this page.`
                : `You lose access immediately and this account is deleted for good ${info.purge_window_days} days from now. Until that date nothing is touched and you can cancel from this page.`}
            </p>
            <label className="mt-4 block text-xs uppercase tracking-wider text-white/50">
              Type DELETE to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              className="mt-2 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={typed.trim().toUpperCase() !== "DELETE" || busy !== ""}
                onClick={() => act("remove", { confirm: "DELETE" })}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {busy === "remove" ? "Working..." : isAcademy ? "Close my academy" : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
