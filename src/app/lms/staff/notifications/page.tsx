"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STAFF_API } from "../../../../lib/api";

type TeacherNotification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string | null;
};

function notificationHref(n: TeacherNotification): string | null {
  if (n.reference_type === "task" && n.reference_id) return `/lms/staff/tasks`;
  if (n.reference_type === "group_chat") return "/lms/staff/chats";
  return null;
}

export default function StaffNotificationsPage() {
  const router = useRouter();
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("lms_staff_token");
  }, []);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(STAFF_API.notifications, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((p) => { setNotifications(Array.isArray(p) ? p : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function markRead(id: number) {
    await fetch(STAFF_API.markNotificationRead(id), { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await fetch(STAFF_API.markAllNotificationsRead, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function handleClick(n: TeacherNotification) {
    if (!n.is_read) markRead(n.id);
    const href = notificationHref(n);
    if (href) router.push(href);
  }

  if (loading) return <LoadingSpinner />;

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/30 p-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Notifications</h1>
          <p className="mt-1 text-sm text-white/60">
            {unread.length > 0 ? `${unread.length} unread` : "No new notifications"}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="shrink-0 rounded-lg border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/70 transition hover:bg-white/15"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(n)}
              onKeyDown={(e) => { if (e.key === "Enter") handleClick(n); }}
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                n.is_read
                  ? "border-white/10 bg-white/5"
                  : "border-white/18 bg-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={`text-sm ${n.is_read ? "text-white/70" : "font-semibold text-white"}`}>
                    {n.title}
                  </p>
                  {n.body ? <p className="mt-1 text-xs text-white/50">{n.body}</p> : null}
                  <p className="mt-2 text-[11px] text-white/40 capitalize">{n.type?.replace("_", " ")}</p>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/15"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
