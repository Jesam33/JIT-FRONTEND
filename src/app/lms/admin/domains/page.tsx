"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, ownerAuthHeaders } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";

// One DNS record the owner must publish (from TenantDomain::dnsInstructions).
type Dns = { type: string; name: string; value: string };
type Domain = {
  id: number;
  host: string;
  status: "pending" | "verified";
  verified: boolean;
  is_primary: boolean;
  verified_at: string | null;
  dns: Dns;
};
type DomainsResponse = {
  enabled: boolean;
  domains: Domain[];
  cname_target: string;
};

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:bg-white/10";

// A single copyable field (label + monospace value + Copy button). Clipboard is
// best-effort, some browsers block it outside a user gesture or over http.
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable, the owner can still select the text */
    }
  };
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-site-muted">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/90">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function DomainsPage() {
  const router = useRouter();
  const [data, setData] = useState<DomainsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(OWNER_API.domains, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (res.ok) {
        setData(await res.json());
      } else {
        setMsg({ kind: "err", text: `Could not load domains (HTTP ${res.status}).` });
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

  const add = async () => {
    if (!host.trim()) return;
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.addDomain, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ host: host.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setMsg({ kind: "err", text: json?.message || "Custom domains are not part of your current plan." });
        return;
      }
      if (!res.ok) {
        setMsg({ kind: "err", text: json?.message || `Could not add domain (HTTP ${res.status}).` });
        return;
      }
      setHost("");
      setMsg({ kind: "ok", text: json?.message || "Domain added. Publish the DNS records below, then verify." });
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setAdding(false);
    }
  };

  const verify = async (d: Domain) => {
    setBusyId(d.id);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.verifyDomain(d.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ kind: "ok", text: json?.message || "Domain verified." });
      } else {
        setMsg({ kind: "err", text: json?.message || "We could not find the verification record yet." });
      }
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (d: Domain) => {
    setBusyId(d.id);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.deleteDomain(d.id), {
        method: "DELETE",
        headers: ownerAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ kind: "ok", text: json?.message || "Domain removed." });
      } else {
        setMsg({ kind: "err", text: json?.message || `Could not remove domain (HTTP ${res.status}).` });
      }
      await load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold display-gradient sm:text-3xl">Custom domain</h1>
        <Link href="/lms/admin" className="text-sm text-site-muted hover:text-white">
          ← Dashboard
        </Link>
      </div>

      {loading && <div className="text-sm text-site-muted">Loading…</div>}

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

      {data && !data.enabled ? (
        <div className="rounded-[20px] border border-white/15 bg-white/[0.04] p-6">
          <p className="text-sm text-white/85">
            Custom domains are available on the Pro plan and above. Upgrade to point your own address,
            for example learn.youracademy.com, at your academy.
          </p>
          <Link
            href="/lms/admin/billing"
            className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-90"
          >
            See plans
          </Link>
        </div>
      ) : null}

      {data && data.enabled ? (
        <>
          {/* Add a domain */}
          <div className="rounded-[20px] border border-white/15 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold text-white">Add a domain</h2>
            <p className="mt-1 text-sm text-site-muted">
              Enter a domain you own. You will add two DNS records to point it at your academy and prove
              you control it.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="learn.youracademy.com"
                className={inputClass}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add();
                }}
              />
              <button
                type="button"
                onClick={add}
                disabled={adding || !host.trim()}
                className="shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-90 disabled:opacity-60"
              >
                {adding ? "Adding…" : "Add domain"}
              </button>
            </div>
          </div>

          {/* Existing domains */}
          <div className="space-y-4">
            {data.domains.length === 0 ? (
              <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6 text-sm text-site-muted">
                No custom domains yet. Add one above to get started.
              </div>
            ) : (
              data.domains.map((d) => (
                <div key={d.id} className="rounded-[20px] border border-white/15 bg-white/[0.04] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-white">{d.host}</span>
                      {d.verified ? (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                          Pending
                        </span>
                      )}
                      {d.is_primary ? (
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80">
                          Primary
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {!d.verified ? (
                        <button
                          type="button"
                          onClick={() => verify(d)}
                          disabled={busyId === d.id}
                          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:brightness-90 disabled:opacity-60"
                        >
                          {busyId === d.id ? "Checking…" : "Verify"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => remove(d)}
                        disabled={busyId === d.id}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {!d.verified ? (
                    <div className="mt-5 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs text-site-muted">
                        Add these records at your DNS provider. The CNAME points the domain at the
                        platform; the TXT record proves you own it. Verification can take a little while
                        after you save them.
                      </p>
                      <CopyField label="CNAME record (name)" value={d.host} />
                      <CopyField label="CNAME record (points to)" value={data.cname_target} />
                      <div className="border-t border-white/10" />
                      <CopyField label="TXT record (name)" value={d.dns.name} />
                      <CopyField label="TXT record (value)" value={d.dns.value} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-site-muted">
                      Your academy is reachable at{" "}
                      <span className="text-white/90">https://{d.host}</span>.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-site-muted">
            After a domain verifies, your team enables HTTPS for it on the server. Contact support if the
            secure certificate does not appear within a few minutes of verification.
          </p>
        </>
      ) : null}
    </div>
  );
}
