"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken, maybeUpgrade } from "@/lib/owner-client";
import { formatPrice } from "@/lib/currency";
import LoadingSpinner from "@/components/LoadingSpinner";

type AgentRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  referral_code: string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string | null;
  approved_at: string | null;
  students_referred: number;
  registrations: number;
  total_earned: number;
  balance: number;
};

type Totals = {
  agents: number;
  approved: number;
  pending: number;
  students_referred: number;
  total_earned: number;
  total_balance: number;
};

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-red-500/15 text-red-300";
  const label = status === "approved" ? "Approved" : status === "pending" ? "Pending" : "Rejected";
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-site-muted">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function OwnerAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Per-row in-flight state + the outcome banner. Rejecting an APPROVED agent
  // revokes their portal access (they sign in no more), so it gets a confirm
  // step in the row before it fires; rejecting a pending application is final
  // but harmless, so it fires directly.
  const [actingId, setActingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OWNER_API.agents, { headers: ownerAuthHeaders() });
      // Admission Marketer network is Basic+: on a lower plan raise the global
      // upgrade modal instead of rendering an empty list.
      if (await maybeUpgrade(res)) return;
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load agents (HTTP ${res.status}).`);
        return;
      }
      const json = await res.json();
      setAgents(Array.isArray(json.agents) ? json.agents : []);
      setTotals(json.totals ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    load();
  }, [load, router]);

  const act = async (agent: AgentRow, action: "approve" | "reject") => {
    setActingId(agent.id);
    setActionMsg(null);
    try {
      const res = await fetch(action === "approve" ? OWNER_API.approveAgent(agent.id) : OWNER_API.rejectAgent(agent.id), {
        method: "POST",
        headers: { Accept: "application/json", ...ownerAuthHeaders() },
      });
      if (await maybeUpgrade(res)) return;
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg({ kind: "err", text: json?.message || `Could not ${action} agent (HTTP ${res.status}).` });
        return;
      }
      // Approval reports honestly whether the email left the server.
      setActionMsg({
        kind: action === "approve" && json?.email_sent === false ? "err" : "ok",
        text: json?.message || (action === "approve" ? `Approved ${agent.name}.` : `Rejected ${agent.name}.`),
      });
      setConfirmingId(null);
      load();
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setActingId(null);
    }
  };

  if (loading && !agents.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Agents</h1>
        <p className="mt-1 text-sm text-site-muted">
          Everyone advertising your academy as an Admission Marketer, with their referrals and payout balance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {actionMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionMsg.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Agents" value={String(totals.agents)} />
          <StatCard label="Approved" value={String(totals.approved)} />
          <StatCard label="Pending" value={String(totals.pending)} />
          <StatCard label="Students referred" value={String(totals.students_referred)} />
          <StatCard label="Total earned" value={formatPrice(totals.total_earned)} />
          <StatCard label="Balance owed" value={formatPrice(totals.total_balance)} />
        </div>
      )}

      <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                <th className="px-5 py-3 font-semibold">Agent</th>
                <th className="px-5 py-3 font-semibold">Referral code</th>
                <th className="px-5 py-3 font-semibold">Students</th>
                <th className="px-5 py-3 font-semibold">Registrations</th>
                <th className="px-5 py-3 font-semibold">Earned</th>
                <th className="px-5 py-3 font-semibold">Balance</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {a.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-primary text-xs font-bold text-white ring-1 ring-white/20">
                          {a.name.split(" ").map((s) => s[0] ?? "").join("").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{a.name}</p>
                        <p className="truncate text-xs text-site-muted">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs tracking-wider text-site-muted">{a.referral_code}</td>
                  <td className="px-5 py-3 text-white">{a.students_referred}</td>
                  <td className="px-5 py-3 text-white">{a.registrations}</td>
                  <td className="px-5 py-3 text-white">{formatPrice(a.total_earned)}</td>
                  <td className="px-5 py-3 font-medium text-white">{formatPrice(a.balance)}</td>
                  <td className="px-5 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-5 py-3">
                    {confirmingId === a.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-site-muted">Revoke access?</span>
                        <button
                          type="button"
                          onClick={() => act(a, "reject")}
                          disabled={actingId === a.id}
                          className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                        >
                          {actingId === a.id ? "Revoking…" : "Revoke"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {a.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => act(a, "approve")}
                            disabled={actingId === a.id}
                            className="rounded-full bg-site-primary px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                          >
                            {actingId === a.id ? "Approving…" : "Approve"}
                          </button>
                        )}
                        {a.status === "approved" && (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(a.id)}
                            disabled={actingId === a.id}
                            className="rounded-full border border-red-500/40 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                          >
                            Revoke
                          </button>
                        )}
                        {a.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => act(a, "reject")}
                            disabled={actingId === a.id}
                            className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-60"
                          >
                            {actingId === a.id ? "Rejecting…" : "Reject"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !agents.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-site-muted">
                    No agents yet. Share your academy link so people can apply to market your courses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
