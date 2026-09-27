"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, clearOwnerToken } from "@/lib/owner-client";
import { DEFAULT_BRANDING, academyLabel, type OwnerBranding } from "@/lib/owner-branding";
import { tenantLoginPath } from "@/lib/tenant-client";

type OwnerNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  at: string | null;
  // Present only on the academy's REAL notification rows (raised by the backend
  // when something consequential happens). Its absence marks a synthesised
  // activity item — ended cohort, newest student/staff, pending agent
  // application — which is derived on every read and therefore cannot be
  // dismissed, only handled at its source.
  notification_id?: number | null;
  is_read?: boolean;
  reference_type?: string | null;
  reference_id?: number | null;
};

// Where a real owner notification sends the owner when clicked. Mirrors
// App\Support\NotificationLinks::pathFor('owner', ...) on the backend, so the
// emailed deep link and the in-portal click land in the same place. null means
// the item is informational and not clickable.
function ownerNotificationHref(n: OwnerNotification): string | null {
  switch (n.reference_type) {
    case "course":
      return "/lms/admin/courses";
    case "cohort":
      return "/lms/admin/tracks";
    case "staff":
      return "/lms/admin/staff";
    case "student":
      return "/lms/admin/students";
    case "payment":
      return "/lms/admin/payments";
    case "agent":
    case "registration":
      return "/lms/admin/agents";
    default:
      return null;
  }
}

// localStorage key holding the ISO timestamp the owner last opened the bell;
// anything newer counts as unread. This only covers the SYNTHESISED activity
// items — the real notification rows carry their own is_read flag, which the
// backend owns and the badge adds on top.
const SEEN_KEY = "lms_owner_notifs_seen";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function OwnerTopbar({
  name,
  branding,
}: {
  name?: string | null;
  branding?: OwnerBranding | null;
}) {
  const router = useRouter();
  const b = branding ?? DEFAULT_BRANDING;
  const instituteName = name || `Your ${academyLabel(branding).singular}`;
  const initials = instituteName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [menu, setMenu] = useState<"none" | "notifications" | "account">("none");
  const [items, setItems] = useState<OwnerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  // Clearing the whole bell is destructive with no undo, so it asks first with
  // the inline two-step confirm the admin pages use (no window.confirm). A
  // single row does not ask: it is one item, and a mis-click costs a
  // notification the owner had already read.
  const [confirmingClear, setConfirmingClear] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Theme toggle is intentionally hidden for now: the portal runs in a single
  // dark theme while the light theme is being finished. Restore the theme
  // state, the sync effect, toggleTheme and the toggle button to bring it back.

  // Poll institute activity for the bell. Unread = synthesised items newer than
  // last seen, PLUS the academy's real unread rows. The real half comes from the
  // response's own count rather than from the rendered list, which is capped —
  // so the badge stays honest past the cap.
  useEffect(() => {
    const recount = (list: OwnerNotification[], serverUnread: number) => {
      let seen = 0;
      try {
        const raw = localStorage.getItem(SEEN_KEY);
        seen = raw ? new Date(raw).getTime() : 0;
      } catch {
        seen = 0;
      }
      const local = list.filter((i) => i.notification_id == null && i.at && new Date(i.at).getTime() > seen).length;
      setUnread(local + serverUnread);
    };

    const load = () => {
      if (document.hidden) return;
      fetch(OWNER_API.notifications, { headers: ownerAuthHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!j) return;
          const list: OwnerNotification[] = j.notifications ?? [];
          setItems(list);
          recount(list, Number(j.unread) || 0);
        })
        .catch(() => {});
    };

    load();
    pollRef.current = setInterval(load, 60000);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const openNotifications = () => {
    setMenu((m) => (m === "notifications" ? "none" : "notifications"));
    // Opening the panel marks everything seen: the local marker for the
    // synthesised items, and a read-all for the real rows (optimistically
    // applied here so the badge clears without waiting for the round trip).
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setUnread(0);
    if (items.some((n) => n.notification_id != null && !n.is_read)) {
      setItems((prev) => prev.map((n) => (n.notification_id != null ? { ...n, is_read: true } : n)));
      fetch(OWNER_API.markAllOwnerNotificationsRead, { method: "POST", headers: ownerAuthHeaders() }).catch(() => {});
    }
  };

  const dismissOne = (id: number) => {
    setItems((prev) => prev.filter((n) => n.notification_id !== id));
    fetch(OWNER_API.dismissOwnerNotification(id), { method: "DELETE", headers: ownerAuthHeaders() }).catch(() => {});
  };

  const clearAll = () => {
    setItems((prev) => prev.filter((n) => n.notification_id == null));
    setConfirmingClear(false);
    fetch(OWNER_API.clearOwnerNotifications, { method: "POST", headers: ownerAuthHeaders() }).catch(() => {});
  };

  const handleLogout = () => {
    clearOwnerToken();
    router.push(tenantLoginPath("owner"));
  };

  // Clear-all only makes sense when there is at least one real row; the
  // synthesised activity items have nothing to clear.
  const hasRealItems = items.some((n) => n.notification_id != null);

  const iconBtn =
    "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 [html.light_&]:border-black/10 [html.light_&]:bg-black/5 [html.light_&]:text-black/80 [html.light_&]:hover:bg-black/[0.08]";

  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 [html.light_&]:border-site-border [html.light_&]:bg-site-surface [html.light_&]:shadow-sm">
        {/* Institute identity: logo if set, else initials + name */}
        <div className="flex min-w-0 items-center gap-3">
          {b.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.logo_url}
              alt={instituteName}
              className="h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-white/20"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-primary text-sm font-bold text-[#fff] ring-1 ring-white/20">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 [html.light_&]:text-black/45">
              {academyLabel(branding).singular} Admin
            </p>
            <p className="truncate text-sm font-semibold text-white [html.light_&]:text-black">
              {instituteName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle intentionally hidden while light mode is being finished. */}

          {/* Notifications */}
          <button type="button" onClick={openNotifications} className={iconBtn} aria-label="Notifications">
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            type="button"
            onClick={() => setMenu((m) => (m === "account" ? "none" : "account"))}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 pr-3 text-white/80 transition hover:bg-white/10 [html.light_&]:border-black/10 [html.light_&]:bg-black/5 [html.light_&]:text-black/80 [html.light_&]:hover:bg-black/[0.08]"
            aria-label="Account menu"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-site-primary text-[11px] font-bold text-[#fff]">
              {initials}
            </span>
            <svg className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown backdrop (click-away) */}
      {menu !== "none" && (
        <button
          className="fixed inset-0 z-40 cursor-default"
          aria-label="Close menu"
          onClick={() => setMenu("none")}
        />
      )}

      {/* Notifications panel */}
      {menu === "notifications" && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0b] shadow-2xl [html.light_&]:border-site-border [html.light_&]:bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 [html.light_&]:border-black/10">
            <p className="text-sm font-semibold text-white [html.light_&]:text-black">Activity</p>
            {hasRealItems &&
              (confirmingClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/30"
                  >
                    Confirm clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/70 transition hover:bg-white/10 [html.light_&]:border-black/15 [html.light_&]:text-black/70 [html.light_&]:hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingClear(true)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300 [html.light_&]:border-black/10"
                >
                  Clear all
                </button>
              ))}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/50 [html.light_&]:text-black/50">
                Nothing yet. New students, staff and agent applications will show up here.
              </p>
            ) : (
              items.map((n) => {
                // Ended cohorts and pending agent applications are action items,
                // not just activity: they stay in the bell until handled, and
                // clicking one opens the page where they are handled. Real
                // notification rows carry their own destination instead.
                const isCohort = n.type === "cohort_ended";
                const isAgent = n.type === "agent_applied";
                const href =
                  ownerNotificationHref(n) ??
                  (isCohort
                    ? "/lms/admin/certificates"
                    : isAgent
                      ? "/lms/admin/agents"
                      : null);
                const open = href
                  ? () => {
                      setMenu("none");
                      router.push(href);
                    }
                  : undefined;
                return (
                  <div
                    key={n.id}
                    role={open ? "button" : undefined}
                    tabIndex={open ? 0 : undefined}
                    onClick={open}
                    onKeyDown={
                      open
                        ? (e) => {
                            if (e.key === "Enter") open();
                          }
                        : undefined
                    }
                    className={`flex items-start gap-3 border-b border-white/5 px-4 py-3 last:border-0 [html.light_&]:border-black/5 ${
                      open ? "cursor-pointer transition hover:bg-white/5 [html.light_&]:hover:bg-black/5" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                        n.type === "staff_added"
                          ? "bg-site-secondary"
                          : isCohort
                            ? "bg-amber-500"
                            : isAgent
                              ? "bg-emerald-500"
                              : "bg-site-primary"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {isCohort ? (
                          <>
                            <circle cx="12" cy="8" r="6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
                          </>
                        ) : isAgent ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.83 10.17a4 4 0 010 5.66l-3 3a4 4 0 01-5.66-5.66l1.5-1.5M10.17 13.83a4 4 0 010-5.66l3-3a4 4 0 015.66 5.66l-1.5 1.5" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white [html.light_&]:text-black">{n.title}</p>
                      <p className="truncate text-xs text-white/60 [html.light_&]:text-black/60">{n.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[10px] text-white/40 [html.light_&]:text-black/40">
                        {timeAgo(n.at)}
                      </span>
                      {/* Only the real rows can be cleared. The synthesised ones
                          are derived on every read from live data, so they go
                          away by handling the thing they point at. */}
                      {n.notification_id != null && (
                        <button
                          type="button"
                          aria-label="Clear this notification"
                          title="Clear this notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissOne(n.notification_id as number);
                          }}
                          className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/50 transition hover:bg-red-500/10 hover:text-red-300 [html.light_&]:border-black/10 [html.light_&]:text-black/50"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Account panel */}
      {menu === "account" && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0b] py-1.5 shadow-2xl [html.light_&]:border-site-border [html.light_&]:bg-white">
          <Link
            href="/lms/admin/branding"
            onClick={() => setMenu("none")}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 [html.light_&]:text-black/85 [html.light_&]:hover:bg-black/5"
          >
            <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Customization
          </Link>
          <div className="my-1 border-t border-white/10 [html.light_&]:border-black/10" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
