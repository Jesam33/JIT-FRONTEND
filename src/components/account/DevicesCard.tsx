"use client";

// The devices signed in to this account, and the two ways out of them.
//
// This card exists because of the "new sign-in" email: that mail is only useful
// if the person who receives it has somewhere to go next, and this is that
// place. It sits on all three profiles (student, staff, owner) and shares one
// component for the same reason the danger zone does — the three do the same
// thing and a second copy would drift.
//
// Two things it deliberately does NOT do:
//
//   • It never offers "sign out" on the row you are reading the page on. Doing
//     so would kill your own session mid-click and the page could not even tell
//     you it worked. The backend refuses it too (422 + is_current).
//   • It does not try to be clever about which rows are suspicious. The
//     fingerprint is ip + user agent, so a phone that moved from wifi to mobile
//     data shows as a new device. That is honest: the list says what was seen,
//     not what it concluded.

import { useCallback, useEffect, useState } from "react";

type Device = {
  fingerprint: string;
  label: string;
  ip: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  is_current: boolean;
};

type Props = {
  /** The student/staff apiFetch, or the owner's token-carrying fetcher. */
  fetcher: (url: string, options?: RequestInit) => Promise<Response>;
  /** GET the device list. */
  listEndpoint: string;
  /** POST { fingerprint } to sign one device out. */
  signOutEndpoint: string;
  /** POST {} to sign out everywhere except here. */
  signOutAllEndpoint: string;
};

function when(value: string | null): string {
  if (!value) return "unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function DevicesCard({ fetcher, listEndpoint, signOutEndpoint, signOutAllEndpoint }: Props) {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetcher(listEndpoint);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.devices)) setDevices(data.devices as Device[]);
    } catch {
      /* leave the list hidden; the card renders nothing it cannot stand behind */
    }
  }, [fetcher, listEndpoint]);

  useEffect(() => { load(); }, [load]);

  async function post(url: string, body: Record<string, unknown>, kind: string) {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      const res = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? "That did not go through. Please try again.");
        return;
      }
      setNotice(data?.message ?? "");
      await load();
    } catch {
      setError("That did not go through. Please check your connection and try again.");
    } finally {
      setBusy("");
    }
  }

  // Nothing to show and nothing to say: an empty card would be noise on a
  // profile that is otherwise about editing things.
  if (!devices || devices.length === 0) return null;

  const others = devices.filter((d) => !d.is_current).length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Where you are signed in</h3>
        {others > 0 ? (
          <button
            type="button"
            onClick={() => post(signOutAllEndpoint, {}, "all")}
            disabled={busy !== ""}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
          >
            {busy === "all" ? "Signing out..." : `Sign out everywhere else (${others})`}
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Every browser that has signed in to this account. If you see one you do not recognise, sign it
        out and change your password.
      </p>

      <div className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
        {devices.map((d) => (
          <div key={d.fingerprint} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                {d.label || "Unknown browser"}
                {d.is_current ? (
                  <span className="ml-2 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-300">
                    This device
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/45">
                {d.ip ? `${d.ip} · ` : ""}Last seen {when(d.last_seen_at)}
                {d.first_seen_at ? ` · First seen ${when(d.first_seen_at)}` : ""}
              </p>
            </div>

            {d.is_current ? (
              <span className="text-xs text-white/35">Signed in here now</span>
            ) : (
              <button
                type="button"
                onClick={() => post(signOutEndpoint, { fingerprint: d.fingerprint }, d.fingerprint)}
                disabled={busy !== ""}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
              >
                {busy === d.fingerprint ? "Signing out..." : "Sign out"}
              </button>
            )}
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-green-400">{notice}</p> : null}
    </div>
  );
}
