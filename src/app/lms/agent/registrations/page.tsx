"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import LoadingSpinner from "../../../../components/LoadingSpinner";

type Registration = {
  id: number;
  name: string;
  email: string;
  phone: string;
  course: string;
  type: "direct" | "referral";
  status: string;
  enrolled: boolean;
  student_id: number | null;
  payment_status: string;
  commission: number;
  commission_status: string | null;
  created_at: string;
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
};

const paymentLabel: Record<string, string> = {
  none: "No Payment",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

export default function AgentRegistrationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.registrations, { headers: headers() });
      const d = await res.json();
      setItems(d.data ?? (Array.isArray(d) ? d : []));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (paymentFilter !== "all" && r.payment_status !== paymentFilter) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>My Students</h2>
            <p className="text-xs text-white/50 mt-0.5">{items.filter(r => r.enrolled).length} enrolled &middot; {items.length} total registrations</p>
          </div>
          <button onClick={() => router.push("/lms/agent/register-student")} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition">
            Register New Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-white/25 transition placeholder:text-white/30" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none cursor-pointer">
          <option value="all">All Types</option>
          <option value="direct">Direct</option>
          <option value="referral">Referral</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none cursor-pointer">
          <option value="all">All Payments</option>
          <option value="none">No Payment</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/15 bg-black/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.1em] text-white/50">
                <th className="px-5 py-3 text-left font-medium">Student</th>
                <th className="px-5 py-3 text-left font-medium">Course</th>
                <th className="px-5 py-3 text-center font-medium">Type</th>
                <th className="px-5 py-3 text-center font-medium">Enrolled</th>
                <th className="px-5 py-3 text-center font-medium">Payment</th>
                <th className="px-5 py-3 text-right font-medium">Commission</th>
                <th className="px-5 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-white/40">No registrations found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-white/90">{r.name}</p>
                    <p className="text-xs text-white/50">{r.email} &middot; {r.phone}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/70">{r.course}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                      r.type === "direct" ? "bg-blue-500/15 text-blue-300" : "bg-purple-500/15 text-purple-300"
                    }`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {r.enrolled ? (
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase bg-emerald-500/15 text-emerald-300">Yes</span>
                    ) : (
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase bg-white/10 text-white/40">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                      r.payment_status === "paid" ? "bg-emerald-500/15 text-emerald-300" :
                      r.payment_status === "pending" ? "bg-amber-500/15 text-amber-300" :
                      r.payment_status === "failed" ? "bg-red-500/15 text-red-300" :
                      "bg-white/10 text-white/40"
                    }`}>
                      {paymentLabel[r.payment_status] ?? r.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {r.commission > 0 ? (
                      <span className="text-sm font-semibold text-emerald-400 tabular-nums">₦{r.commission.toLocaleString()}</span>
                    ) : (
                      <span className="text-xs text-white/30">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-white/50 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
