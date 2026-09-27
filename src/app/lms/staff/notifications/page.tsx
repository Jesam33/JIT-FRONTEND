"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff, getStaffToken } from "../../../../lib/fetch-with-timeout";
import { useTeachingBase } from "@/lib/teaching-base";

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

function notificationHref(n: TeacherNotification, base: string): string | null {
  if (n.reference_type === "task" || n.reference_type === "task_submission") return `${base}/tasks`;
  if (n.reference_type === "group_chat") return `${base}/chats`;
  if (n.reference_type === "dm_thread") return `${base}/chats`;
  if (n.reference_type === "scheduled_class") return `${base}/timetable`;
  return null;
}

export default function StaffNotificationsPage() {
  // Deep links must stay inside the shell showing this page (see lib/teaching-base).
  const base = useTeachingBase();
  const router = useRouter();
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getStaffToken();
  }, []);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetchStaff(STAFF_API.notifications)
      .then((r) => r.json())
      .then((p) => { setNotifications(Array.isArray(p) ? p : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function markRead(id: number) {
    await apiFetchStaff(STAFF_API.markNotificationRead(id), { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await apiFetchStaff(STAFF_API.markAllNotificationsRead, { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  // Clearing the whole bell is destructive with no undo, so it asks first with
  // the same inline two-step confirm the admin pages use (no window.confirm).
  // A single row does not ask: it is one item, and a mis-click costs a
  // notification the user had already read.
  async function dismiss(id: number) {
    setDismissingId(id);
    try {
      await apiFetchStaff(STAFF_API.dismissNotification(id), { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDismissingId(null);
    }
  }

  async function clearAll() {
    setClearing(true);
    try {
      await apiFetchStaff(STAFF_API.clearNotifications, { method: "POST" });
      setNotifications([]);
      setConfirmingClear(false);
    } finally {
      setClearing(false);
    }
  }

  function handleClick(n: TeacherNotification) {
    if (!n.is_read) markRead(n.id);
    const href = notificationHref(n, base);
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
        <div className="flex items-center gap-3">
          {unread.length > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="shrink-0 rounded-lg border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/70 transition hover:bg-white/15"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            confirmingClear ? (
              <>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={clearing}
                  className="shrink-0 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                >
                  {clearing ? "Clearing…" : "Confirm clear"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="shrink-0 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-sm text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Clear all
              </button>
            )
          )}
        </div>
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
                <div className="flex shrink-0 items-center gap-2">
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/15"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Clear this notification"
                    title="Clear this notification"
                    disabled={dismissingId === n.id}
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  >
                    {dismissingId === n.id ? "…" : "Clear"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
