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

  if (loading) return <p className="text-site-text/60">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications</h2>
        {items.some((n) => !n.is_read) ? (
          <button onClick={markAllRead} className="text-xs text-blue-400 underline hover:text-blue-300">Mark all as read</button>
        ) : null}
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
              <p className={`text-sm ${n.is_read ? "text-site-text/60" : "text-site-text font-medium"}`}>{n.title}</p>
              {n.body ? <p className="mt-1 text-xs text-site-text/50">{n.body}</p> : null}
              <p className="mt-1 text-[10px] text-site-text/30">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
