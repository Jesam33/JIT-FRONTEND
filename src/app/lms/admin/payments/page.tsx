"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, ownerAuthHeaders, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel } from "@/lib/owner-branding";
import { tenantLoginPath } from "@/lib/tenant-client";

type Bank = { name: string; code: string };

type PaymentSettings = {
  payment: {
    configured: boolean;
    subaccount_code: string | null;
    // Whether the platform created this subaccount (split follows the plan) or the
    // owner pasted a code (its split is their own, unknown to us).
    managed: boolean;
    // The split actually recorded on the linked subaccount, if known.
    subaccount_commission_percent: number | null;
    business_name: string | null;
    bank_code: string | null;
    bank_name: string | null;
    account_number_masked: string | null;
    account_name: string | null;
  };
  platform_commission_percent: number;
  gateway_ready: boolean;
  banks: Bank[];
};

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:bg-white/10";

export default function PaymentsPage() {
  const router = useRouter();

  const [data, setData] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Link-a-subaccount form (bank-details path).
  const [businessName, setBusinessName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Account-name confirmation (Paystack /bank/resolve) — confirmatory only, it
  // links nothing and never blocks linking if the gateway can't resolve.
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(OWNER_API.paymentSettings, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (res.ok) {
        const json: PaymentSettings = await res.json();
        setData(json);
        setBusinessName(json.payment.business_name ?? "");
        setBankCode(json.payment.bank_code ?? "");
      } else {
        setMsg({ kind: "err", text: `Could not load payment settings (HTTP ${res.status}).` });
      }
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    load();
  }, [load, router]);

  // Confirm the account holder's name once a full 10-digit NUBAN + a bank are
  // entered. Debounced so we don't hit Paystack on every keystroke. This is
  // purely confirmatory — it never gates linking, and a down/unconfigured
  // gateway just leaves the note blank.
  useEffect(() => {
    setAccountName("");
    setResolveError("");
    if (!bankCode || accountNumber.length !== 10) {
      setResolving(false);
      return;
    }
    let cancelled = false;
    setResolving(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(OWNER_API.resolveAccount, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
          body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.account_name) {
          setAccountName(json.account_name);
        } else {
          setResolveError(json?.message || "Couldn’t verify this account — you can still link it.");
        }
      } catch {
        if (!cancelled) setResolveError("Couldn’t verify this account — you can still link it.");
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bankCode, accountNumber]);

  const link = async () => {
    setMsg(null);
    if (!businessName.trim() || !bankCode || !accountNumber.trim()) {
      setMsg({ kind: "err", text: "Enter your business name, bank, and account number." });
      return;
    }
    setSaving(true);
    try {
      const bank = data?.banks.find((b) => b.code === bankCode);
      const res = await fetch(OWNER_API.paymentSettingsUpdate, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({
          business_name: businessName.trim(),
          bank_code: bankCode,
          bank_name: bank?.name ?? null,
          account_number: accountNumber.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!res.ok) {
        setMsg({ kind: "err", text: json?.message || `Could not link payout account (HTTP ${res.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: json?.message || "Payout account linked." });
      setAccountNumber("");
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(OWNER_API.paymentSettingsUpdate, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ disconnect: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!res.ok) {
        setMsg({ kind: "err", text: json?.message || `Could not disconnect (HTTP ${res.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: json?.message || "Payout account disconnected." });
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const configured = data?.payment.configured;
  const commission = data?.platform_commission_percent ?? 0;
  const managed = data?.payment.managed ?? false;
  const linkedSplit = data?.payment.subaccount_commission_percent ?? null;
  // A managed subaccount's split should track the plan; flag it if it has drifted
  // (e.g. a sync that didn't confirm). A pasted code's split is unknown to us.
  const splitDrifted = !!configured && managed && linkedSplit != null && linkedSplit !== commission;
  const pastedCode = !!configured && !managed;
  // This academy's configurable noun, read synchronously from the shell cookie.
  const label = academyLabel(readOwnerBranding()).singular;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold display-gradient sm:text-3xl">Course payments</h1>
        <Link href="/lms/admin" className="text-sm text-site-muted hover:text-white">
          ← Dashboard
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-site-muted">
        Link your {label}&apos;s own bank so course fees paid by students settle to{" "}
        <span className="text-white">your account</span> — not the platform. The applicable platform
        fee is deducted from each eligible successful course sale —{" "}
        <span className="text-white">{commission}%</span> on your current plan.
      </p>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            msg.kind === "ok"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.04]" />
        </div>
      )}

      {!loading && data && !data.gateway_ready && (
        <div className="rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-6 text-sm text-amber-100">
          The payment gateway isn&apos;t enabled on this environment yet. You&apos;ll be able to link a
          payout bank once it&apos;s live.
        </div>
      )}

      {/* CONNECTED STATE */}
      {!loading && data && data.gateway_ready && configured && (
        <div className="rounded-[20px] border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20">✓</span>
            Payout account linked
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.payment.business_name && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-site-muted">Business name</dt>
                <dd className="mt-0.5 text-sm text-white">{data.payment.business_name}</dd>
              </div>
            )}
            {data.payment.bank_name && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-site-muted">Bank</dt>
                <dd className="mt-0.5 text-sm text-white">{data.payment.bank_name}</dd>
              </div>
            )}
            {data.payment.account_number_masked && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-site-muted">Account number</dt>
                <dd className="mt-0.5 font-mono text-sm text-white">{data.payment.account_number_masked}</dd>
              </div>
            )}
            {data.payment.account_name && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-site-muted">Account name</dt>
                <dd className="mt-0.5 text-sm text-white">{data.payment.account_name}</dd>
              </div>
            )}
          </dl>

          {/* Platform fee / payout split on this academy's course sales. */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-site-muted">
                Platform fee on course sales
              </span>
              <span className="text-lg font-semibold text-white">{commission}%</span>
            </div>
            <p className="mt-1 text-xs text-site-muted">
              Deducted from each successful course sale on your current plan — the rest settles to your
              bank.
            </p>
            {splitDrifted && (
              <p className="mt-2 text-xs text-amber-300">
                Your linked payout split is currently {linkedSplit}%. It updates to {commission}%
                automatically after a plan change; if it doesn&apos;t, disconnect and relink your bank.
              </p>
            )}
            {pastedCode && (
              <p className="mt-2 text-xs text-site-muted">
                This account was linked by subaccount code, so its split is controlled on your Paystack
                account and may differ from your plan fee.
              </p>
            )}
          </div>

          <button
            onClick={disconnect}
            disabled={saving}
            className="mt-6 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
          >
            {saving ? "Working…" : "Disconnect account"}
          </button>
          <p className="mt-3 text-xs text-site-muted">
            After disconnecting, course fees settle to the platform account until you link a bank again.
          </p>
        </div>
      )}

      {/* NOT-CONNECTED STATE — link form */}
      {!loading && data && data.gateway_ready && !configured && (
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">Link your payout bank</h2>
          <p className="mt-1 text-sm text-site-muted">
            We&apos;ll create a secure Paystack payout account for your {label}. Fees settle to this
            bank automatically.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-white/80">Business / {label} name</label>
              <input
                className={inputClass}
                value={businessName}
                placeholder="e.g. Bright Future Academy"
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/80">Bank</label>
              <select
                className={inputClass}
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              >
                <option value="">Select your bank…</option>
                {data.banks.map((b, i) => (
                  // Paystack's bank list repeats codes (a bank + its USSD/variant
                  // entries share one code, e.g. 057), so key on code+index — the
                  // value stays the code, which is what we submit and look up.
                  <option key={`${b.code}-${i}`} value={b.code} className="bg-[#0b0b0b]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/80">Account number</label>
              <input
                className={inputClass}
                value={accountNumber}
                inputMode="numeric"
                maxLength={10}
                placeholder="0123456789"
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              />
              {bankCode && accountNumber.length === 10 ? (
                <p className="mt-1.5 text-xs" aria-live="polite">
                  {resolving ? (
                    <span className="text-site-muted">Verifying account…</span>
                  ) : accountName ? (
                    <span className="font-medium text-emerald-300">✓ {accountName}</span>
                  ) : resolveError ? (
                    <span className="text-amber-300">{resolveError}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          <button
            onClick={link}
            disabled={saving}
            className="mt-6 rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Linking…" : "Link payout account"}
          </button>
        </div>
      )}
    </div>
  );
}
