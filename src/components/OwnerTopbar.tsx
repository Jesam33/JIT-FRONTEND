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
};

// localStorage key holding the ISO timestamp the owner last opened the bell;
// anything newer counts as unread. Keeps "unread" state without a backend table.
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

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [menu, setMenu] = useState<"none" | "notifications" | "account">("none");
  const [items, setItems] = useState<OwnerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Sync the toggle with whatever the pre-paint theme script already applied.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  // Poll institute activity for the bell. Unread = items newer than last seen.
  useEffect(() => {
    const recount = (list: OwnerNotification[]) => {
      let seen = 0;
      try {
        const raw = localStorage.getItem(SEEN_KEY);
        seen = raw ? new Date(raw).getTime() : 0;
      } catch {
        seen = 0;
      }
      const n = list.filter((i) => i.at && new Date(i.at).getTime() > seen).length;
      setUnread(n);
    };

    const load = () => {
      if (document.hidden) return;
      fetch(OWNER_API.notifications, { headers: ownerAuthHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!j) return;
          const list: OwnerNotification[] = j.notifications ?? [];
          setItems(list);
          recount(list);
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
    // Opening the panel marks everything seen.
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setUnread(0);
  };

  const handleLogout = () => {
    clearOwnerToken();
    router.push(tenantLoginPath("owner"));
  };

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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-primary text-sm font-bold text-white ring-1 ring-white/20">
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
          {/* Theme toggle */}
          <button type="button" onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme">
            {theme === "light" ? (
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

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
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-site-primary text-[11px] font-bold text-white">
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
          <div className="border-b border-white/10 px-4 py-3 [html.light_&]:border-black/10">
            <p className="text-sm font-semibold text-white [html.light_&]:text-black">Activity</p>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/50 [html.light_&]:text-black/50">
                Nothing yet. New students and staff will show up here.
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 border-b border-white/5 px-4 py-3 last:border-0 [html.light_&]:border-black/5"
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                      n.type === "staff_added" ? "bg-site-secondary" : "bg-site-primary"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white [html.light_&]:text-black">{n.title}</p>
                    <p className="truncate text-xs text-white/60 [html.light_&]:text-black/60">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-white/40 [html.light_&]:text-black/40">
                    {timeAgo(n.at)}
                  </span>
                </div>
              ))
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
