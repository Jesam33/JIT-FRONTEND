"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, ownerAuthHeaders, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel } from "@/lib/owner-branding";
import { tenantLoginPath } from "@/lib/tenant-client";
import { currencySymbol, formatPrice } from "@/lib/currency";
import { setAcademyCurrency } from "@/lib/academy-currency";

// Payout / account setup, the "Payment" tab of the owner Profile page and the
// post-signup payment step. Self-contained: owns its load/save.
//
//   1. The academy's country, which fixes the currency it sells and is paid in.
//   2. The bank students' payments settle to. New links go through Flutterwave
//      (any supported country): the bank becomes a subaccount and every payment
//      is split automatically, the academy's share straight to its bank.
//      Academies linked on Paystack before the move keep working and are asked
//      to re-link. Without Flutterwave keys the old Paystack (Nigeria) form is used.
//   3. The admission-agent commission rate.
// Backend: OwnerPayoutController (+ OwnerAdminController for the agent rate).

type Bank = { id?: number; name: string; code: string };
type Branch = { code: string; name: string };
type Country = { code: string; name: string; currency: string; form: "bank_list" | "iban" | "routing"; branch: boolean };

type PaymentSettings = {
  payment: {
    configured: boolean;
    provider: "flutterwave" | "paystack" | null;
    needs_relink: boolean;
    business_name: string | null;
    bank_name: string | null;
    account_number_masked: string | null;
    account_name: string | null;
  };
  academy: { country: string; currency: string; currency_locked: boolean; currency_lock_reason: string | null };
  link_provider: "flutterwave" | "paystack" | null;
  countries: Country[];
  platform_commission_percent: number;
  // The cut this academy pays its own admission agents per sale, and whether the
  // agent programme is part of the plan at all (the card only shows when it is).
  agent_commission_percent: number;
  agent_program_enabled: boolean;
  gateway_ready: boolean;
  // Paystack-only setups: the Nigerian bank list comes with the page.
  banks: Bank[];
};

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:bg-white/10";
const labelClass = "mb-1.5 block text-sm text-white/80";

export default function PayoutSettings({
  onStatus,
  heading,
}: {
  // Called after every load/resave with whether a payout account is linked. The
  // signup onboarding step (/lms/admin/payment-setup) uses it to reveal its
  // "continue to dashboard" action the moment linking succeeds, without a second
  // fetch of the same endpoint.
  onStatus?: (configured: boolean, gatewayReady: boolean) => void;
  // Optional stand-in for the intro paragraph, so the onboarding step can explain
  // why the owner is here instead of the profile-page wording.
  heading?: React.ReactNode;
} = {}) {
  const router = useRouter();

  const [data, setData] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Linked academies only see the form when they choose to change bank / re-link.
  const [showForm, setShowForm] = useState(false);

  // Agent commission. `agentRate` is the editable percent; `sample` is an example
  // sale price the owner can change to preview their net per sale.
  const [agentRate, setAgentRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [sample, setSample] = useState("10000");

  // Bank form. Fetched lists are remembered with what they were fetched for, so
  // a stale list is simply not shown (no resetting state inside effects).
  const [fetchedBanks, setFetchedBanks] = useState<{ country: string; list: Bank[] } | null>(null);
  const [bankCode, setBankCode] = useState("");
  const [fetchedBranches, setFetchedBranches] = useState<{ bankId: number; list: Branch[] } | null>(null);
  const [branchCode, setBranchCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [phone, setPhone] = useState("");
  const [swift, setSwift] = useState("");
  const [routing, setRouting] = useState("");

  // Account-name confirmation (Nigeria only), confirmatory: never blocks linking.
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  // Held in a ref (not a dep) so `load` stays identity-stable.
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

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
        setAgentRate(String(json.agent_commission_percent ?? ""));
        setAcademyCurrency(json.academy?.currency ?? "NGN");
        onStatusRef.current?.(json.payment.configured, json.gateway_ready);
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
    (async () => {
      await load();
    })();
  }, [load, router]);

  const flutterwave = data?.link_provider === "flutterwave";
  const country = data?.academy.country ?? "NG";
  const spec: Country | undefined = data?.countries.find((c) => c.code === country);
  const form = spec?.form ?? "bank_list";
  const currency = data?.academy.currency ?? "NGN";

  // The bank list for the academy's country (Flutterwave), or the one that
  // came with the page (Paystack-only setups). IBAN countries have none.
  const needsBankList = !!data && flutterwave && form !== "iban";
  useEffect(() => {
    if (!needsBankList) return;
    let cancelled = false;
    (async () => {
      let list: Bank[] = [];
      try {
        const res = await fetch(OWNER_API.payoutBanks(country), { headers: ownerAuthHeaders() });
        const json = await res.json().catch(() => ({}));
        list = Array.isArray(json?.banks) ? json.banks : [];
      } catch {
        list = [];
      }
      if (!cancelled) setFetchedBanks({ country, list });
    })();
    return () => {
      cancelled = true;
    };
  }, [needsBankList, country]);

  const banks: Bank[] = !data
    ? []
    : !flutterwave
      ? data.banks ?? []
      : form === "iban" || fetchedBanks?.country !== country
        ? []
        : fetchedBanks.list;
  const banksLoading = needsBankList && fetchedBanks?.country !== country;

  // Branches, for the countries that need a branch code. Often there's no list:
  // the owner then types the code.
  const selectedBankId = banks.find((b) => b.code === bankCode)?.id;
  const needsBranches = flutterwave && !!spec?.branch && !!selectedBankId;
  useEffect(() => {
    if (!needsBranches || !selectedBankId) return;
    let cancelled = false;
    (async () => {
      let list: Branch[] = [];
      try {
        const res = await fetch(OWNER_API.payoutBranches(selectedBankId), { headers: ownerAuthHeaders() });
        const json = await res.json().catch(() => ({}));
        list = Array.isArray(json?.branches) ? json.branches : [];
      } catch {
        list = [];
      }
      if (!cancelled) setFetchedBranches({ bankId: selectedBankId, list });
    })();
    return () => {
      cancelled = true;
    };
  }, [needsBranches, selectedBankId]);

  const branches: Branch[] = needsBranches && fetchedBranches?.bankId === selectedBankId ? fetchedBranches.list : [];

  // Confirm the holder name once a 10-digit Nigerian account + bank are entered.
  useEffect(() => {
    setResolvedName("");
    setResolveError("");
    if (country !== "NG" || !bankCode || accountNumber.length !== 10) {
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
          setResolvedName(json.account_name);
          // Fill the holder name from the bank record so it matches exactly.
          setHolderName(String(json.account_name));
        } else {
          setResolveError(json?.message || "Couldn’t verify this account. You can still link it.");
        }
      } catch {
        if (!cancelled) setResolveError("Couldn’t verify this account. You can still link it.");
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [country, bankCode, accountNumber]);

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) {
      router.replace(tenantLoginPath("owner"));
      return null;
    }
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  const changeCountry = async (code: string) => {
    if (!data || code === country) return;
    setMsg(null);
    setSaving(true);
    try {
      const r = await post(OWNER_API.academyCountry, { country: code });
      if (!r) return;
      if (!r.ok) {
        setMsg({ kind: "err", text: r.json?.message || `Could not change the country (HTTP ${r.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: r.json?.message || "Saved." });
      setBankCode("");
      setBranchCode("");
      setAccountNumber("");
      setSwift("");
      setRouting("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const link = async () => {
    setMsg(null);
    const missing =
      !holderName.trim() ? "Enter the name on the bank account."
        : !accountNumber.trim() ? (form === "iban" ? "Enter your IBAN." : "Enter your account number.")
          : form !== "iban" && !bankCode ? "Choose your bank."
            : flutterwave && !phone.trim() ? "Enter a phone number for the account."
              : flutterwave && form !== "bank_list" && !swift.trim() ? "Enter your bank’s SWIFT/BIC code."
                : flutterwave && form === "routing" && !routing.trim() ? "Enter your routing number."
                  : null;
    if (missing) {
      setMsg({ kind: "err", text: missing });
      return;
    }

    setSaving(true);
    try {
      const bank = banks.find((b) => b.code === bankCode);
      const parts = holderName.trim().split(/\s+/);
      const body = flutterwave
        ? {
            country,
            bank_code: form === "iban" ? null : bankCode,
            bank_name: bank?.name ?? null,
            account_number: accountNumber.trim(),
            account_name: holderName.trim(),
            phone: phone.trim(),
            swift_code: swift.trim() || null,
            routing_number: routing.trim() || null,
            branch_code: branchCode.trim() || null,
          }
        : {
            // Paystack (Nigeria) takes the legal name in two parts.
            first_name: parts[0] ?? "",
            last_name: parts.slice(1).join(" ") || parts[0] || "",
            bank_code: bankCode,
            bank_name: bank?.name ?? null,
            account_number: accountNumber.trim(),
          };
      const r = await post(OWNER_API.paymentSettingsUpdate, body);
      if (!r) return;
      if (!r.ok) {
        setMsg({ kind: "err", text: r.json?.message || `Could not link payout account (HTTP ${r.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: r.json?.message || "Payout account linked." });
      setAccountNumber("");
      setShowForm(false);
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
      const r = await post(OWNER_API.paymentSettingsUpdate, { disconnect: true });
      if (!r) return;
      if (!r.ok) {
        setMsg({ kind: "err", text: r.json?.message || `Could not disconnect (HTTP ${r.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: r.json?.message || "Payout account disconnected." });
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  // Save just the agent commission rate (a rate-only update never touches the bank).
  const saveAgentRate = async () => {
    setMsg(null);
    const rate = parseFloat(agentRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setMsg({ kind: "err", text: "Enter a commission rate between 0 and 100." });
      return;
    }
    setSavingRate(true);
    try {
      const r = await post(OWNER_API.paymentSettingsUpdate, { agent_commission_percent: rate });
      if (!r) return;
      if (!r.ok) {
        setMsg({ kind: "err", text: r.json?.message || `Could not update agent commission (HTTP ${r.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: r.json?.message || "Agent commission updated." });
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSavingRate(false);
    }
  };

  const configured = data?.payment.configured;
  const commission = data?.platform_commission_percent ?? 0;
  const label = academyLabel(readOwnerBranding()).singular;
  const formOpen = !configured || showForm;

  // Agent commission preview figures.
  const agentProgramEnabled = data?.agent_program_enabled ?? false;
  const agentRateNum = Math.max(0, Math.min(100, parseFloat(agentRate) || 0));
  const sampleNum = Math.max(0, parseInt(sample || "0", 10) || 0);
  const platformCut = (sampleNum * commission) / 100;
  const agentCut = (sampleNum * agentRateNum) / 100;
  const keepAgentSale = Math.max(0, sampleNum - platformCut - agentCut);
  const keepDirectSale = Math.max(0, sampleNum - platformCut);
  const money = (n: number) => formatPrice(Math.round(n), currency);

  return (
    <div className="space-y-6">
      {heading ?? (
        <p className="max-w-2xl text-sm text-site-muted">
          Link your {label}&apos;s own bank so the money students pay goes straight to{" "}
          <span className="text-white">your account</span>, automatically. A service charge of{" "}
          <span className="text-white">{commission}%</span> is taken from each student payment.
        </p>
      )}

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

      {loading && !data && (
        <div className="space-y-3">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.04]" />
        </div>
      )}

      {data && !data.gateway_ready && (
        <div className="rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-6 text-sm text-amber-100">
          The payment gateway isn&apos;t enabled on this environment yet. You&apos;ll be able to link a
          payout bank once it&apos;s live.
        </div>
      )}

      {/* COUNTRY + CURRENCY */}
      {data && data.gateway_ready && (
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">Country and currency</h2>
          <p className="mt-1 max-w-2xl text-sm text-site-muted">
            Where your {label} is based. Your course prices are in this country&apos;s currency, students
            pay in it, and you&apos;re paid in it.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-72">
              <label className={labelClass} htmlFor="payout-country">Country</label>
              <select
                id="payout-country"
                className={inputClass}
                value={country}
                disabled={saving || data.academy.currency_locked || data.countries.length <= 1}
                onChange={(e) => changeCountry(e.target.value)}
              >
                {data.countries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#0b0b0b]">
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white">
              Currency: <span className="font-semibold">{currency}</span>{" "}
              <span className="text-site-muted">({currencySymbol(currency).trim()})</span>
            </div>
          </div>
          {data.academy.currency_locked ? (
            <p className="mt-3 text-xs text-site-muted">{data.academy.currency_lock_reason}</p>
          ) : configured ? (
            <p className="mt-3 text-xs text-site-muted">To change country, disconnect your bank first.</p>
          ) : (
            <p className="mt-3 text-xs text-site-muted">
              Changing country changes the currency your prices are read in, so check your course prices afterwards.
            </p>
          )}
        </div>
      )}

      {/* RE-LINK (linked on Paystack before the move to Flutterwave) */}
      {data && data.gateway_ready && configured && data.payment.needs_relink && !showForm && (
        <div className="rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-6">
          <h2 className="text-base font-semibold text-amber-100">Please re-link your bank</h2>
          <p className="mt-1 max-w-2xl text-sm text-amber-100/80">
            We&apos;ve moved to a new payment provider that supports more countries and currencies. Your
            current bank still works for now, but please re-link it so payments keep reaching you.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110"
          >
            Re-link my bank
          </button>
        </div>
      )}

      {/* CONNECTED STATE */}
      {data && data.gateway_ready && configured && !showForm && (
        <div className="rounded-[20px] border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20">✓</span>
            Payout account linked
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.payment.account_name || data.payment.business_name ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-site-muted">Account name</dt>
                <dd className="mt-0.5 text-sm text-white">{data.payment.account_name || data.payment.business_name}</dd>
              </div>
            ) : null}
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
            <div>
              <dt className="text-xs uppercase tracking-wide text-site-muted">Paid in</dt>
              <dd className="mt-0.5 text-sm text-white">{currency}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-site-muted">Service charge on student payments</span>
              <span className="text-lg font-semibold text-white">{commission}%</span>
            </div>
            <p className="mt-1 text-xs text-site-muted">
              Taken from every student payment: once for a one-time course, every month for a monthly
              course. The rest goes to your bank automatically, and you get the breakdown each time a
              student pays.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              disabled={saving}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 disabled:opacity-60"
            >
              Change bank
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={saving}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {saving ? "Working…" : "Disconnect account"}
            </button>
          </div>
          <p className="mt-3 text-xs text-site-muted">
            While no bank is linked, students can&apos;t pay for courses.
          </p>
        </div>
      )}

      {/* LINK FORM */}
      {data && data.gateway_ready && formOpen && (
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">{configured ? "Link a new bank" : "Link your payout bank"}</h2>
          <p className="mt-1 text-sm text-site-muted">
            {spec ? `A bank account in ${spec.name}. ` : ""}Students&apos; payments go to it automatically, in {currency}.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {form !== "iban" && (
              <div>
                <label className={labelClass} htmlFor="payout-bank">Bank</label>
                <select
                  id="payout-bank"
                  className={inputClass}
                  value={bankCode}
                  disabled={banksLoading}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    setBranchCode("");
                  }}
                >
                  <option value="">{banksLoading ? "Loading banks…" : "Select your bank…"}</option>
                  {banks.map((b, i) => (
                    // Bank lists can repeat a code (a bank and its variants), so
                    // key on code+index; the value stays the code we submit.
                    <option key={`${b.code}-${i}`} value={b.code} className="bg-[#0b0b0b]">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="payout-account">{form === "iban" ? "IBAN" : "Account number"}</label>
              <input
                id="payout-account"
                className={inputClass}
                value={accountNumber}
                inputMode={country === "NG" ? "numeric" : "text"}
                maxLength={country === "NG" ? 10 : 40}
                placeholder={form === "iban" ? "GB33 BUKB 2020 1555 5555 55" : country === "NG" ? "0123456789" : "Account number"}
                onChange={(e) =>
                  setAccountNumber(
                    country === "NG" ? e.target.value.replace(/[^\d]/g, "").slice(0, 10) : e.target.value.toUpperCase().slice(0, 40),
                  )
                }
              />
              {country === "NG" && bankCode && accountNumber.length === 10 ? (
                <p className="mt-1.5 text-xs" aria-live="polite">
                  {resolving ? (
                    <span className="text-site-muted">Verifying account…</span>
                  ) : resolvedName ? (
                    <span className="font-medium text-emerald-300">✓ {resolvedName}</span>
                  ) : resolveError ? (
                    <span className="text-amber-300">{resolveError}</span>
                  ) : null}
                </p>
              ) : null}
            </div>

            {flutterwave && form === "routing" && (
              <div>
                <label className={labelClass} htmlFor="payout-routing">Routing number</label>
                <input id="payout-routing" className={inputClass} value={routing} inputMode="numeric" placeholder="021000021"
                  onChange={(e) => setRouting(e.target.value.replace(/[^\d]/g, "").slice(0, 12))} />
              </div>
            )}

            {flutterwave && form !== "bank_list" && (
              <div>
                <label className={labelClass} htmlFor="payout-swift">SWIFT / BIC code</label>
                <input id="payout-swift" className={inputClass} value={swift} placeholder="BUKBGB22"
                  onChange={(e) => setSwift(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} />
              </div>
            )}

            {flutterwave && spec?.branch && (
              <div>
                <label className={labelClass} htmlFor="payout-branch">Branch</label>
                {branches.length > 0 ? (
                  <select id="payout-branch" className={inputClass} value={branchCode} onChange={(e) => setBranchCode(e.target.value)}>
                    <option value="">Select your branch…</option>
                    {branches.map((b) => (
                      <option key={b.code} value={b.code} className="bg-[#0b0b0b]">{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <input id="payout-branch" className={inputClass} value={branchCode} placeholder="Branch code (if your bank uses one)"
                    onChange={(e) => setBranchCode(e.target.value.slice(0, 40))} />
                )}
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="payout-holder">Name on the account</label>
              <input id="payout-holder" className={inputClass} value={holderName} placeholder="Exactly as your bank has it"
                onChange={(e) => setHolderName(e.target.value)} />
            </div>

            {flutterwave && (
              <div>
                <label className={labelClass} htmlFor="payout-phone">Phone number</label>
                <input id="payout-phone" className={inputClass} value={phone} inputMode="tel" placeholder="+233 24 000 0000"
                  onChange={(e) => setPhone(e.target.value.slice(0, 30))} />
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-site-muted">
            Use the exact name on the bank account so the payout account activates without a manual review.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={link}
              disabled={saving}
              className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Linking…" : "Link payout account"}
            </button>
            {configured && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80 transition hover:border-white/40"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* AGENT COMMISSION, only when the plan includes the admission agent programme */}
      {data && agentProgramEnabled && (
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">Agent commission</h2>
          <p className="mt-1 max-w-2xl text-sm text-site-muted">
            What you pay an admission agent for each sale they bring in. It comes out of your own
            earnings on that sale, separately from the service charge. A direct sale with no agent
            involved pays no commission.
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="w-44">
              <label className={labelClass}>Commission rate</label>
              <div className="relative">
                <input
                  className={`${inputClass} pr-8`}
                  value={agentRate}
                  inputMode="decimal"
                  placeholder="5"
                  onChange={(e) => setAgentRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 6))}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-site-muted">%</span>
              </div>
            </div>
            <button
              onClick={saveAgentRate}
              disabled={savingRate}
              className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110 disabled:opacity-60"
            >
              {savingRate ? "Saving…" : "Save rate"}
            </button>
          </div>

          {/* Net-per-sale preview */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-site-muted">Example on a sale of</span>
              <div className="relative w-40">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-site-muted">
                  {currencySymbol(currency).trim()}
                </span>
                <input
                  className="w-full rounded-lg border border-white/15 bg-white/5 py-1.5 pl-12 pr-3 text-right text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                  value={sample}
                  inputMode="numeric"
                  onChange={(e) => setSample(e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                />
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-site-muted">Sale price</dt>
                <dd className="font-medium text-white">{money(sampleNum)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-site-muted">Service charge ({commission}%)</dt>
                <dd className="text-white">{money(platformCut)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-site-muted">Agent commission ({agentRateNum}%)</dt>
                <dd className="text-white">{money(agentCut)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <dt className="font-semibold text-white">You keep on an agent sale</dt>
                <dd className="font-semibold text-emerald-300">{money(keepAgentSale)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-site-muted">You keep on a direct sale</dt>
                <dd className="text-white">{money(keepDirectSale)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-site-muted">
              Commission is recorded when an agent refers or registers a paid student, and settles from
              your agent payouts. Changing the rate affects new sales only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
