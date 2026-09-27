"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type Notification = {
  id: number; type: string; title: string; body: string | null;
  is_read: boolean; created_at: string;
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

export default function AgentNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // Clearing the whole bell asks first (inline two-step, matching the admin
  // pages); clearing one row does not, since a mis-click costs one read item.
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.notifications, { headers: headers() });
      const d = await res.json();
      setItems(d.data ?? (Array.isArray(d) ? d : []));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: number) {
    await fetchWithTimeout(AGENT_API.markNotificationRead(id), { method: "POST", headers: headers() });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    await fetchWithTimeout(AGENT_API.markAllNotificationsRead, { method: "POST", headers: headers() });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function dismiss(id: number) {
    setDismissingId(id);
    try {
      await fetchWithTimeout(AGENT_API.dismissNotification(id), { method: "DELETE", headers: headers() });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDismissingId(null);
    }
  }

  async function clearAll() {
    setClearing(true);
    try {
      await fetchWithTimeout(AGENT_API.clearNotifications, { method: "POST", headers: headers() });
      setItems([]);
      setConfirmingClear(false);
    } finally {
      setClearing(false);
    }
  }

  if (loading) return <p className="text-site-text/60">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="flex items-center gap-3">
          {items.some((n) => !n.is_read) ? (
            <button onClick={markAllRead} className="text-xs text-blue-400 underline hover:text-blue-300">Mark all as read</button>
          ) : null}
          {items.length > 0 ? (
            confirmingClear ? (
              <>
                <button
                  onClick={clearAll}
                  disabled={clearing}
                  className="text-xs font-semibold text-red-400 underline hover:text-red-300 disabled:opacity-60"
                >
                  {clearing ? "Clearing..." : "Confirm clear"}
                </button>
                <button onClick={() => setConfirmingClear(false)} className="text-xs text-site-text/60 underline">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmingClear(true)} className="text-xs text-red-400/80 underline hover:text-red-300">
                Clear all
              </button>
            )
          ) : null}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-site-text/60">No notifications.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`rounded-lg border px-4 py-3 cursor-pointer transition ${n.is_read ? "border-site-border bg-site-surface-soft" : "border-site-border bg-site-surface"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm ${n.is_read ? "text-site-text/60" : "text-site-text font-medium"}`}>{n.title}</p>
                  {n.body ? <p className="mt-1 text-xs text-site-text/50">{n.body}</p> : null}
                  <p className="mt-1 text-[10px] text-site-text/30">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  aria-label="Clear this notification"
                  title="Clear this notification"
                  disabled={dismissingId === n.id}
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                  className="shrink-0 rounded border border-site-border px-2 py-1 text-[10px] text-site-text/50 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {dismissingId === n.id ? "..." : "Clear"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
