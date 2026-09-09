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

type AgentDetail = {
  agent: AgentRow;
  stats: {
    students_referred: number;
    registrations: number;
    total_earned: number;
    pending_withdrawal: number;
    paid_out: number;
    balance: number;
  };
  referrals: { id: number; name: string; email: string; course: string; enrolled_at: string | null; created_at: string | null }[];
  registrations: {
    id: number;
    name: string;
    course: string | null;
    type: "direct" | "referral" | string;
    status: string;
    payment_status: string;
    commission: number;
    commission_status: string | null;
    created_at: string | null;
  }[];
  transactions: { id: number; amount: number; type: string; status: string; notes: string | null; created_at: string | null }[];
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function initialsOf(name: string): string {
  return name.split(" ").map((s) => s[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20" />;
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-primary text-xs font-bold text-white ring-1 ring-white/20">
      {initialsOf(name)}
    </span>
  );
}

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/[0.04]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function OwnerAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Drill-down: `detailFor` is the agent id whose analytics view is open; the
  // data itself lives in `detail`. The list stays mounted so going back is
  // instant (no refetch).
  const [detailFor, setDetailFor] = useState<number | null>(null);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Per-row in-flight state + the outcome banner. Rejecting an APPROVED agent
  // revokes their portal access, so it gets a confirm step in the row before it
  // fires; rejecting a pending application is final but harmless, so it fires
  // directly.
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

  const loadDetail = useCallback(
    async (id: number) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await fetch(OWNER_API.agent(id), { headers: ownerAuthHeaders() });
        if (await maybeUpgrade(res)) return;
        if (res.status === 401 || res.status === 403) {
          router.replace("/lms/admin/login");
          return;
        }
        if (!res.ok) {
          setDetailError(`Could not load this agent (HTTP ${res.status}).`);
          return;
        }
        setDetail(await res.json());
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : String(err));
      } finally {
        setDetailLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    load();
  }, [load, router]);

  useEffect(() => {
    if (detailFor !== null) loadDetail(detailFor);
    else setDetail(null);
  }, [detailFor, loadDetail]);

  const openDetail = (id: number) => {
    setConfirmingId(null);
    setActionMsg(null);
    setDetailFor(id);
  };

  const act = async (agent: { id: number; name: string }, action: "approve" | "reject") => {
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
      if (detailFor === agent.id) loadDetail(agent.id);
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setActingId(null);
    }
  };

  // ─── Detail (per-agent analytics) view ────────────────────────────────────
  if (detailFor !== null) {
    const a = detail?.agent;
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => { setDetailFor(null); setActionMsg(null); }}
            className="inline-flex items-center gap-2 text-sm font-medium text-site-muted transition hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All agents
          </button>
        </div>

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

        {detailLoading && !detail ? (
          <LoadingSpinner />
        ) : detailError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{detailError}</div>
        ) : detail && a ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
              <div className="flex items-center gap-4">
                <Avatar name={a.name} url={a.avatar_url} />
                <div>
                  <h1 className="text-xl font-semibold text-white sm:text-2xl">{a.name}</h1>
                  <p className="mt-0.5 text-sm text-site-muted">{a.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill status={a.status} />
                    <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[11px] tracking-wider text-site-muted">
                      {a.referral_code}
                    </span>
                    <span className="text-xs text-site-muted">Joined {fmtDate(a.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => act(a, "approve")}
                    disabled={actingId === a.id}
                    className="rounded-full bg-site-primary px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {actingId === a.id ? "Approving…" : "Approve"}
                  </button>
                )}
                {a.status === "approved" &&
                  (confirmingId === a.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => act(a, "reject")}
                        disabled={actingId === a.id}
                        className="rounded-full bg-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                      >
                        {actingId === a.id ? "Revoking…" : "Confirm revoke"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(a.id)}
                      disabled={actingId === a.id}
                      className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      Revoke access
                    </button>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Students referred" value={String(detail.stats.students_referred)} />
              <StatCard label="Registrations" value={String(detail.stats.registrations)} />
              <StatCard label="Total earned" value={formatPrice(detail.stats.total_earned)} />
              <StatCard label="Pending payout" value={formatPrice(detail.stats.pending_withdrawal)} />
              <StatCard label="Paid out" value={formatPrice(detail.stats.paid_out)} />
              <StatCard label="Balance" value={formatPrice(detail.stats.balance)} />
            </div>

            <SectionCard title="Registrations they brought in">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold">Course</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Payment</th>
                      <th className="px-5 py-3 font-semibold">Commission</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.registrations.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3 text-white">{r.name}</td>
                        <td className="px-5 py-3 text-site-muted">{r.course ?? "—"}</td>
                        <td className="px-5 py-3 capitalize text-site-muted">{r.type}</td>
                        <td className="px-5 py-3 capitalize text-site-muted">{r.payment_status.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3 text-white">
                          {formatPrice(r.commission)}
                          {r.commission_status ? <span className="ml-2 text-[11px] capitalize text-site-muted">{r.commission_status.replace(/_/g, " ")}</span> : null}
                        </td>
                        <td className="px-5 py-3 text-site-muted">{fmtDate(r.created_at)}</td>
                      </tr>
                    ))}
                    {!detail.registrations.length && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-site-muted">
                          No registrations yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Students they referred">
                <ul className="divide-y divide-white/5">
                  {detail.referrals.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{s.name}</p>
                        <p className="truncate text-xs text-site-muted">{s.email}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-site-muted">{s.course}</p>
                        <p className="text-[11px] text-site-muted">{fmtDate(s.enrolled_at ?? s.created_at)}</p>
                      </div>
                    </li>
                  ))}
                  {!detail.referrals.length && (
                    <li className="px-5 py-8 text-center text-sm text-site-muted">No referred students yet.</li>
                  )}
                </ul>
              </SectionCard>

              <SectionCard title="Payout ledger">
                <ul className="divide-y divide-white/5">
                  {detail.transactions.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm capitalize text-white">{t.type === "withdrawal" ? "Withdrawal" : "Commission"}</p>
                        <p className="truncate text-xs text-site-muted">
                          {t.status.replace(/_/g, " ")}
                          {t.notes ? ` · ${t.notes}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-semibold ${t.amount < 0 ? "text-amber-300" : "text-white"}`}>
                          {formatPrice(t.amount)}
                        </p>
                        <p className="text-[11px] text-site-muted">{fmtDate(t.created_at)}</p>
                      </div>
                    </li>
                  ))}
                  {!detail.transactions.length && (
                    <li className="px-5 py-8 text-center text-sm text-site-muted">No commissions or payouts yet.</li>
                  )}
                </ul>
              </SectionCard>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Agents</h1>
        <p className="mt-1 text-sm text-site-muted">
          Everyone advertising your academy as an Admission Marketer. Click an agent to see their analytics.
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
          <table className="w-full min-w-[860px] text-left text-sm">
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
                <tr key={a.id} className="cursor-pointer border-b border-white/5 last:border-0 transition hover:bg-white/[0.04]" onClick={() => openDetail(a.id)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} url={a.avatar_url} />
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
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
