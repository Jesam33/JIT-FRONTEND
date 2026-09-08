"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, ownerAuthHeaders, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel } from "@/lib/owner-branding";
import { tenantLoginPath } from "@/lib/tenant-client";
import { ACADEMY_NICHES, OTHER_NICHE, isKnownNiche } from "@/lib/niches";

// Personal details, the first tab of the owner Profile page: the owner's own
// LOGIN account (name + email they sign in with, and a password change), plus
// the academy's teaching category (niche). Owns its load/save, exactly like
// PayoutSettings next to it.

type OwnerAccount = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string | null;
  niche: string | null;
};

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:bg-white/10";

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/80">{label}</span>
      <input className={inputClass} {...props} />
      {hint ? <p className="mt-1.5 text-xs text-site-muted">{hint}</p> : null}
    </label>
  );
}

export default function PersonalDetailsEditor() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  // The academy's teaching category, drives the public Campuses directory
  // filter. "Other" swaps the dropdown for the free-text field beside it.
  const [niche, setNiche] = useState("");
  const [nicheOther, setNicheOther] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Password change lives in its own card with its own save, so a name edit
  // never requires typing a password and vice versa.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(OWNER_API.account, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (res.ok) {
        const json = (await res.json()) as { account?: OwnerAccount };
        setFirstName(json.account?.first_name ?? "");
        setLastName(json.account?.last_name ?? "");
        setEmail(json.account?.email ?? "");
        // A stored niche that isn't one of the predefined options is a custom
        // value the owner typed, so preselect "Other" and drop it into the
        // free-text field.
        const storedNiche = json.account?.niche ?? "";
        if (storedNiche && !isKnownNiche(storedNiche)) {
          setNiche(OTHER_NICHE);
          setNicheOther(storedNiche);
        } else {
          setNiche(storedNiche);
          setNicheOther("");
        }
      } else {
        setMsg({ kind: "err", text: `Could not load your details (HTTP ${res.status}).` });
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

  const saveDetails = async () => {
    setMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMsg({ kind: "err", text: "Enter an email address." });
      return;
    }
    // "Other" stores the typed value; a blank niche clears it (backend maps "" to null).
    const resolvedNiche = (niche === OTHER_NICHE ? nicheOther : niche).trim();
    setSaving(true);
    try {
      const res = await fetch(OWNER_API.accountUpdate, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: cleanEmail,
          niche: resolvedNiche,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!res.ok) {
        setMsg({ kind: "err", text: json?.message || `Could not save your details (HTTP ${res.status}).` });
        return;
      }
      setMsg({ kind: "ok", text: json?.message || "Personal details updated." });
      // The shell's sidebar shows the owner's email; refresh the shared identity
      // so it picks the new one up without a reload.
      window.dispatchEvent(new Event("owner-identity-refresh"));
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ kind: "err", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ kind: "err", text: "New password and confirmation don't match." });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(OWNER_API.accountPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!res.ok) {
        setPasswordMsg({ kind: "err", text: json?.message || `Could not update password (HTTP ${res.status}).` });
        return;
      }
      setPasswordMsg({ kind: "ok", text: json?.message || "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
        <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal details */}
      <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Personal details</h2>
        <p className="mt-1 text-sm text-site-muted">
          Your name and the email you use to sign in to this portal.
        </p>

        {msg && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              msg.kind === "ok"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="First name" value={firstName} autoComplete="given-name" onChange={(e) => setFirstName(e.target.value)} />
          <Field label="Last name" value={lastName} autoComplete="family-name" onChange={(e) => setLastName(e.target.value)} />
          <div className="sm:col-span-2">
            <Field
              label="Email address"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              hint="You'll use this email to sign in from now on."
            />
          </div>
          {/* Category (niche), powers the public Campuses directory filter */}
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm text-white/80">Category</span>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className={inputClass}
              aria-label="What your academy teaches"
            >
              {/* Every option needs the explicit dark ground: the page paints a
                  white select popup natively on some platforms, and the shell's
                  white option text would vanish on it (the bank picker in
                  PayoutSettings does the same). */}
              <option value="" className="bg-[#0b0b0b]">Not set</option>
              {ACADEMY_NICHES.map((n) => (
                <option key={n} value={n} className="bg-[#0b0b0b]">
                  {n}
                </option>
              ))}
              <option value={OTHER_NICHE} className="bg-[#0b0b0b]">Other (type your own)</option>
            </select>
            {niche === OTHER_NICHE && (
              <input
                type="text"
                value={nicheOther}
                maxLength={80}
                onChange={(e) => setNicheOther(e.target.value)}
                placeholder="e.g. Aviation training"
                className={`${inputClass} mt-3`}
                aria-label="Your academy category"
              />
            )}
            <p className="mt-1.5 text-xs text-site-muted">
              What your {academyLabel(readOwnerBranding()).singular.toLowerCase()} teaches. This is how prospective students
              find you when they browse academies by category.
            </p>
          </label>
        </div>

        <button
          onClick={saveDetails}
          disabled={saving}
          className="mt-6 rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save details"}
        </button>
      </div>

      {/* Password */}
      <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <p className="mt-1 text-sm text-site-muted">
          Choose a strong password you don&apos;t use anywhere else. You stay signed in on this device
          after changing it.
        </p>

        {passwordMsg && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              passwordMsg.kind === "ok"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Current password"
              type="password"
              value={currentPassword}
              autoComplete="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <Field
            label="New password"
            type="password"
            value={newPassword}
            autoComplete="new-password"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          onClick={savePassword}
          disabled={savingPassword}
          className="mt-6 rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {savingPassword ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}
