"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { STUDENT_API, STAFF_API, AGENT_API } from "../lib/api";

type LmsNavbarProps = {
  portalName: string;
  bellHref: string;
  placeholder: string;
  searchRedirectHref?: string;
  logoUrl?: string | null;
};

export default function LmsNavbar({
  portalName,
  bellHref,
  placeholder,
  searchRedirectHref,
  logoUrl,
}: LmsNavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  // Fetch unread count
  useEffect(() => {
    const name = portalName.toLowerCase();
    const isStudent = name.includes("student");
    // Portal tag reads "Admission Marketer Portal"; also accept the legacy "agent" word.
    const isAgent = name.includes("marketer") || name.includes("agent");
    let tokenKey = "lms_staff_token";
    let apiEndpoint = STAFF_API.notificationUnread;
    if (isStudent) { tokenKey = "lms_student_token"; apiEndpoint = STUDENT_API.chatUnread; }
    if (isAgent) { tokenKey = "lms_agent_token"; apiEndpoint = AGENT_API.notificationUnread; }

    const fetchUnread = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
      if (!token || document.hidden) return;

      fetch(apiEndpoint, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((p) => {
          setUnreadCount(p.unread_notifications ?? 0);
        })
        .catch(() => {});
    };

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30000);

    const onVisible = () => {
      if (!document.hidden) fetchUnread();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [portalName]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchRedirectHref) {
      router.push(`${searchRedirectHref}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/30 p-4 mb-6 sm:flex-row sm:items-center sm:justify-between [html.light_&]:border-site-border [html.light_&]:bg-site-surface [html.light_&]:shadow-sm">
      {/* Institute logo (white-label) */}
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-10 w-10 shrink-0 self-start rounded-full object-contain ring-1 ring-white/20 sm:self-center [html.light_&]:ring-black/10"
        />
      ) : null}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40 [html.light_&]:text-black/40">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 focus:ring-1 focus:ring-white/10 transition [html.light_&]:bg-black/5 [html.light_&]:border-black/10 [html.light_&]:text-black [html.light_&]:placeholder-black/40 [html.light_&]:focus:border-black/20 [html.light_&]:focus:bg-black/[0.08]"
        />
      </form>

      {/* Theme/Portal Metadata & Notification Bell */}
      <div className="flex items-center justify-end gap-3 sm:gap-4">
        {/* Portal Tag */}
        <span className="text-[10px] font-bold text-white/80 [html.light_&]:text-black/80 bg-white/[0.04] [html.light_&]:bg-black/[0.04] px-3 py-2 rounded-xl border border-white/10 [html.light_&]:border-black/10 uppercase tracking-widest">
          {portalName}
        </span>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-white/10 [html.light_&]:bg-black/10" />

        {/* Theme Switch Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/80 [html.light_&]:border-black/10 [html.light_&]:bg-black/5 [html.light_&]:hover:bg-black/[0.08] [html.light_&]:text-black/80"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>

        {/* Bell Icon */}
        <Link
          href={bellHref}
          className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/80 [html.light_&]:border-black/10 [html.light_&]:bg-black/5 [html.light_&]:hover:bg-black/[0.08] [html.light_&]:text-black/80"
          aria-label="Notifications"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification Badge Count (No Ping, Only Count if > 0) */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
