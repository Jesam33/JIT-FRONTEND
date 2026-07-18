"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type DashboardData = {
  total_referred: number;
  total_enrollments: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  balance: number;
  referral_code: string;
  recent_referrals: { id: number; name: string; email: string; course: string; enrolled_at: string }[];
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

export default function AgentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.dashboard, { headers: headers() });
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-site-text/60">Loading dashboard...</p>;
  if (!data) return <p className="text-site-text/60">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agent Dashboard</h2>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-xs text-site-text/50 uppercase tracking-wide">Your Referral Code</p>
        <p className="mt-1 text-2xl font-bold tracking-widest text-site-text">{data.referral_code}</p>
        <button
          onClick={() => navigator.clipboard.writeText(data.referral_code)}
          className="mt-2 text-xs text-blue-400 underline hover:text-blue-300"
        >
          Copy code
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={async () => {
            if (!confirm("Request withdrawal of your pending commissions?")) return;
            try {
              const res = await fetch("/api/frontend/lms/agents/withdrawals/request", {
                method: "POST", headers: headers(),
              });
              const d = await res.json();
              alert(d.message ?? "Done.");
              load();
            } catch { alert("Failed."); }
          }}
          disabled={data.pending_commission <= 0}
          className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
        >
          Request Withdrawal
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-site-border bg-site-surface-soft p-4">
          <p className="text-xs text-site-text/50">Students Referred</p>
          <p className="mt-1 text-2xl font-semibold">{data.total_referred}</p>
        </div>
        <div className="rounded-xl border border-site-border bg-site-surface-soft p-4">
          <p className="text-xs text-site-text/50">Enrollments</p>
          <p className="mt-1 text-2xl font-semibold">{data.total_enrollments}</p>
        </div>
        <div className="rounded-xl border border-site-border bg-site-surface-soft p-4">
          <p className="text-xs text-site-text/50">Pending Commission</p>
          <p className="mt-1 text-2xl font-semibold text-amber-500">&#8358;{data.pending_commission.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-site-border bg-site-surface-soft p-4">
          <p className="text-xs text-site-text/50">Available Balance</p>
          <p className="mt-1 text-2xl font-semibold text-site-text">&#8358;{data.balance.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Recent Referrals</h3>
        {data.recent_referrals.length === 0 ? (
          <p className="mt-2 text-sm text-site-text/60">No referrals yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {data.recent_referrals.map((r) => (
              <div key={r.id} className="rounded-lg border border-site-border bg-site-surface-soft px-4 py-3">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-site-text/50">{r.email} &middot; {r.course}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
