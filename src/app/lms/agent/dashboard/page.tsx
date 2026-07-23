"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import { useToast } from "../../../../components/ToastProvider";
import LoadingSpinner from "../../../../components/LoadingSpinner";

type DashboardData = {
  total_referred: number;
  total_enrollments: number;
  total_earned: number;
  pending_commission: number;
  pending_withdrawal: number;
  paid_commission: number;
  balance: number;
  referral_code: string;
  recent_referrals: { id: number; name: string; email: string; course: string; enrolled_at: string }[];
  recent_transactions: { id: number; amount: number; type: string; status: string; notes: string; created_at: string }[];
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

const statusLabel: Record<string, string> = {
  pending: "Earned",
  withdrawal_requested: "Awaiting Approval",
  paid: "Paid",
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState("");
  const [txType, setTxType] = useState("all");
  const [txStatus, setTxStatus] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.dashboard, { headers: headers() });
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function copyCode() {
    if (!data?.referral_code) return;
    navigator.clipboard.writeText(data.referral_code);
    toast("Referral code copied!", "success");
  }

  const filtered = (data?.recent_transactions ?? []).filter((tx) => {
    if (txSearch && !(tx.notes ?? "").toLowerCase().includes(txSearch.toLowerCase())) return false;
    if (txType !== "all" && tx.type !== txType) return false;
    if (txStatus !== "all" && tx.status !== txStatus) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-sm text-white/60">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">

      {/* Referral Code Banner */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Your Referral Code</p>
            <p className="mt-1 text-2xl font-bold tracking-widest text-white">{data.referral_code}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/5 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Code
            </button>
            <button onClick={() => router.push("/lms/agent/register-student")} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition">
              Register Student
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/60">Total Earned</p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums">₦{data.total_earned.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/60">Pending Withdrawal</p>
          <p className="mt-2 text-3xl font-bold text-amber-400 tabular-nums">₦{data.pending_withdrawal.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/60">Available Balance</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400 tabular-nums">₦{data.balance.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/60">Paid Out</p>
          <p className="mt-2 text-3xl font-bold text-white/50 tabular-nums">₦{data.paid_commission.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={async () => {
            if (!data.has_bank_details) { toast("Please complete your account setup by adding bank details.", "error"); return; }
            if (!confirm("Request withdrawal of your pending commissions?")) return;
            try {
              const res = await fetch("/api/frontend/lms/agents/withdrawals/request", {
                method: "POST", headers: headers(),
              });
              const d = await res.json();
              toast(d.message ?? "Withdrawal requested.", "success");
              load();
            } catch { toast("Failed to request withdrawal.", "error"); }
          }}
          disabled={data.pending_commission <= 0}
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Request Withdrawal
        </button>
        <button
          onClick={() => router.push("/lms/agent/commissions")}
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
        >
          View Commission History
        </button>
      </div>

      {/* Complete Account Setup Banner */}
      {!data.has_bank_details && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-amber-400 text-lg shrink-0">&#9888;</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-200">Complete Your Account Setup</p>
              <p className="mt-1 text-xs text-amber-200/60">
                Add your bank details so we can process your payouts when you request a withdrawal.
              </p>
            </div>
            <button
              onClick={() => router.push("/lms/agent/profile")}
              className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90 transition"
            >
              Add Bank Details
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-2xl border border-white/15 bg-black/30 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-5 pb-0">
          <h2 className="text-base font-semibold text-white whitespace-nowrap mr-2" style={{ fontFamily: "var(--font-display)" }}>Transaction History</h2>
          <div className="relative flex-1 min-w-[160px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={txSearch} onChange={(e) => setTxSearch(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-white/25 transition placeholder:text-white/30" />
          </div>
          <select value={txType} onChange={(e) => setTxType(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none cursor-pointer">
            <option value="all">All Types</option>
            <option value="referral">Referral</option>
            <option value="direct">Direct</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <select value={txStatus} onChange={(e) => setTxStatus(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="pending">Earned</option>
            <option value="withdrawal_requested">Awaiting Approval</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.1em] text-white/50">
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-white/40">No matching transactions.</td></tr>
              ) : filtered.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 text-xs text-white/50 whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3.5 text-sm text-white/80 max-w-[260px] truncate" title={tx.notes || ""}>{tx.notes || tx.type}</td>
                  <td className={`px-5 py-3.5 text-right text-sm font-semibold whitespace-nowrap tabular-nums ${tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-400" : "text-white"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                      tx.status === "paid" ? "bg-emerald-500/15 text-emerald-300" :
                      tx.status === "pending" ? "bg-emerald-500/15 text-emerald-300" :
                      tx.status === "withdrawal_requested" ? "bg-amber-500/15 text-amber-300" :
                      "bg-white/10 text-white/50"
                    }`}>
                      {statusLabel[tx.status] || tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.recent_transactions.length > 0 && (
          <div className="px-5 py-2.5 border-t border-white/10">
            <p className="text-xs text-white/40">Showing {filtered.length} of {data.recent_transactions.length}</p>
          </div>
        )}
      </div>

      {/* Recent Referrals */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>Recent Referrals</h2>
          <div className="flex gap-4 text-xs text-white/50">
            <span>Referred: <strong className="text-white">{data.total_referred}</strong></span>
            <span>Enrollments: <strong className="text-white">{data.total_enrollments}</strong></span>
          </div>
        </div>
        {data.recent_referrals.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">No referrals yet. Start by sharing your referral code or registering a student.</p>
        ) : (
          <div className="mt-4 divide-y divide-white/10">
            {data.recent_referrals.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-white">{r.name}</p>
                  <p className="text-xs text-white/50">{r.email} &middot; {r.course}</p>
                </div>
                <span className="text-xs text-white/40">{r.enrolled_at}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
