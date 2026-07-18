"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type Commission = {
  id: number; course_price: string; commission_amount: string;
  status: string; type: string; notes: string | null; created_at: string;
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

export default function AgentCommissionsPage() {
  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.commissions, { headers: headers() });
      const d = await res.json();
      setItems(d.data ?? (Array.isArray(d) ? d : []));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-site-text/60">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold">Commissions</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-site-text/60">No commission records yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((c) => (
            <div key={c.id} className="rounded-lg border border-site-border bg-site-surface-soft px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">&#8358;{parseFloat(c.commission_amount).toLocaleString()}</p>
                <p className="text-xs text-site-text/50">Course price: &#8358;{parseFloat(c.course_price).toLocaleString()} &middot; {c.type}</p>
                <p className="text-[10px] text-site-text/40">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                c.status === "paid" ? "bg-red-500/20 text-red-200" :
                c.status === "pending" ? "bg-amber-500/20 text-amber-200" :
                "bg-site-surface text-site-text/50"
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
