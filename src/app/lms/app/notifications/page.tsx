"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../../lib/api";
import { getToken } from "../../../../lib/lms-utils";
import { apiFetch } from "../../../../lib/fetch-with-timeout";
import type { NotificationItem } from "../../../../lib/lms-types";

function notificationHref(n: NotificationItem): string | null {
  if (n.reference_type === "task" && n.reference_id) return `/lms/tasks/${n.reference_id}`;
  if (n.reference_type === "group_chat") return "/lms/app/chats";
  if (n.reference_type === "dm_thread") return "/lms/app/chats";
  if (n.reference_type === "scheduled_class") return "/lms/app/classroom";
  // Legacy course classrooms (staff-created live classes) land on the same
  // classroom page, which lists both delivery types.
  if (n.reference_type === "classroom") return "/lms/app/classroom";
  if (n.reference_type === "module") return n.reference_id ? `/lms/app/modules/${n.reference_id}` : "/lms/app/modules";
  if (n.reference_type === "course") return "/lms/app/modules";
  if (n.reference_type === "certificate") return "/lms/app/certificates";
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Clearing the whole bell asks first (inline two-step, matching the admin
  // pages); clearing one row does not, since a mis-click costs one read item.
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch(STUDENT_API.notifications)
      .then((r) => r.json())
      .then((p) => { setNotifications(Array.isArray(p) ? p : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function markRead(id: number) {
    await apiFetch(STUDENT_API.markNotificationRead(id), { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await apiFetch(STUDENT_API.markAllNotificationsRead, { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function dismiss(id: number) {
    setDismissingId(id);
    try {
      await apiFetch(STUDENT_API.dismissNotification(id), { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDismissingId(null);
    }
  }

  async function clearAll() {
    setClearing(true);
    try {
      await apiFetch(STUDENT_API.clearNotifications, { method: "POST" });
      setNotifications([]);
      setConfirmingClear(false);
    } finally {
      setClearing(false);
    }
  }

  function handleClick(n: NotificationItem) {
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
            {unread.length > 0 ? `${unread.length} unread` : "Alerts, mentions, and class reminders."}
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
                  <p className={`text-sm ${n.is_read ? "text-white/70" : "font-semibold text-white"}`}>{n.title}</p>
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
