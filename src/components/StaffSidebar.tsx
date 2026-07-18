"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STAFF_API } from "@/lib/api";

type SidebarGroup = {
  label: string;
  items: { href: string; label: string }[];
};

const groups: SidebarGroup[] = [
  {
    label: "Teaching",
    items: [
      { href: "/lms/staff/app", label: "Dashboard" },
      { href: "/lms/staff/courses", label: "Courses" },
      { href: "/lms/staff/tracks", label: "Tracks" },
      { href: "/lms/staff/students", label: "Students" },
      { href: "/lms/staff/classroom", label: "Classroom" },
      { href: "/lms/staff/timetable", label: "Timetable" },
      { href: "/lms/staff/attendance", label: "Attendance" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/lms/staff/modules", label: "Modules" },
      { href: "/lms/staff/materials", label: "Materials" },
      { href: "/lms/staff/tasks", label: "Tasks" },
      { href: "/lms/staff/certificates", label: "Certificates" },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/lms/staff/chats", label: "Chats" },
      { href: "/lms/staff/notifications", label: "Notifications" },
      { href: "/lms/staff/announcements", label: "Announcements" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/lms/staff/reports", label: "Reports" },
      { href: "/lms/staff/profile", label: "Profile" },
    ],
  },
];

function AccountDropdown({
  teacher,
  initials,
  onLogout,
  onClose,
}: {
  teacher: { name: string; role: string; profile_photo_url?: string | null } | null;
  initials: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border border-site-border bg-site-surface-soft px-3 py-2.5 text-left transition hover:opacity-80 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {teacher?.profile_photo_url ? (
          <img
            src={teacher.profile_photo_url}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white ring-1 ring-white/20">
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {teacher ? teacher.name : "Loading…"}
          </p>
          <p className="truncate text-[11px] text-white/55">
            {teacher ? teacher.role : "Staff"}
          </p>
        </div>

        <svg
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-site-border bg-site-surface shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
          <div className="p-2 space-y-0.5">
            <Link
              href="/lms/staff/profile"
              onClick={() => { setOpen(false); onClose?.(); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <svg className="h-4 w-4 shrink-0 text-white/55" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              View Profile
            </Link>

            <button
              type="button"
              onClick={() => { setOpen(false); onClose?.(); alert("Add account flow coming soon."); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <svg className="h-4 w-4 shrink-0 text-white/55" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add Account
            </button>

            <button
              type="button"
              onClick={() => { setOpen(false); onClose?.(); alert("Switch account flow coming soon."); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <svg className="h-4 w-4 shrink-0 text-white/55" viewBox="0 0 24 24" fill="none">
                <path d="M17 3l4 4-4 4M7 7h14M7 21l-4-4 4-4M17 17H3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Switch Account
            </button>
          </div>

          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={() => { setOpen(false); onClose?.(); onLogout(); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teacher, setTeacher] = useState<{ name: string; role: string; profile_photo_url?: string | null } | null>(null);
  const [badge, setBadge] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem("lms_staff_token") ?? "";
    if (!token) return;
    fetch(STAFF_API.me, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((p) => { if (p?.name) setTeacher(p); })
      .catch(() => {});

    const fetchUnread = () => {
      if (document.hidden) return;
      fetch(STAFF_API.chatUnread, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((p) => {
          setBadge((prev) => ({
            ...prev,
            "/lms/staff/chats": (p.unread_group ?? 0) + (p.unread_dm ?? 0),
          }));
        })
        .catch(() => {});
      fetch(STAFF_API.notificationUnread, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((p) => {
          setBadge((prev) => ({
            ...prev,
            "/lms/staff/notifications": p.unread_notifications ?? 0,
          }));
        })
        .catch(() => {});
    };

    const onVisible = () => { if (!document.hidden) fetchUnread(); };
    const onChatRead = () => { fetchUnread(); };

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("opencode:chat-read", onChatRead);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("opencode:chat-read", onChatRead);
    };
  }, []);

  const initials = teacher
    ? teacher.name.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handleLogout = () => {
    localStorage.removeItem("lms_staff_token");
    onNavigate?.();
    router.push("/lms/staff/login");
  };

  function isActive(href: string) {
    if (href === "/lms/staff/app") {
      return pathname === "/lms/staff" || pathname === "/lms/staff/app";
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-2xl border border-white/20 bg-[#0b0b0b]/95 p-5 max-md:hidden lg:min-h-[760px]">
        <div className="mb-5">
          <AccountDropdown
            teacher={teacher}
            initials={initials}
            onLogout={handleLogout}
          />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{group.label}</p>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const count = badge?.[item.href] ?? 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseDown={() => onNavigate?.()}
                      className={`flex min-h-[44px] items-center rounded-xl border px-4 py-2.5 text-sm transition ${
                        isActive(item.href)
                          ? "border-white/18 bg-white/12 text-white shadow-[0_12px_30px_rgba(255,255,255,0.08)]"
                          : "border-white/6 bg-white/5 text-white/80 hover:border-white/12 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            onClick={handleLogout}
            className="flex min-h-[48px] w-full items-center rounded-xl border border-white/6 bg-white/5 px-4 py-3 text-sm text-red-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3 shrink-0">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2.5">
            {teacher?.profile_photo_url ? (
              <img src={teacher.profile_photo_url} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/80">
                {initials}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-white/90">{teacher ? teacher.name : "Loading…"}</p>
              <p className="text-[10px] text-white/45">{teacher ? teacher.role : "Staff"}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Open staff menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50">
            <button className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-label="Close menu backdrop" />
            <aside className="absolute left-0 top-0 flex h-full w-[min(320px,88vw)] flex-col border-r border-white/15 bg-[#0b0b0b] p-6 text-white shadow-2xl">
              <div className="mb-6">
                <AccountDropdown
                  teacher={teacher}
                  initials={initials}
                  onLogout={handleLogout}
                  onClose={() => setOpen(false)}
                />
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <nav className="flex-1 space-y-5 overflow-y-auto pr-0.5">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{group.label}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const count = badge?.[item.href] ?? 0;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            onMouseDown={() => onNavigate?.()}
                            className={`flex min-h-[44px] items-center rounded-xl border px-4 py-2.5 text-sm transition ${
                              isActive(item.href)
                                ? "border-white/18 bg-white/12 text-white shadow-[0_12px_30px_rgba(255,255,255,0.08)]"
                                : "border-white/6 bg-white/5 text-white/80 hover:border-white/12 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className="flex-1">{item.label}</span>
                            {count > 0 && (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                                {count > 99 ? "99+" : count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="mt-6 border-t border-white/10 pt-4">
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="flex min-h-[48px] w-full items-center rounded-xl border border-white/6 bg-white/5 px-4 py-3 text-sm text-red-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3 shrink-0">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Log Out
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
