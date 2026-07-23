"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import { useToast } from "../../../../components/ToastProvider";

type AgentProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  home_address: string;
  qualification: string;
  referral_code: string;
  status: string;
  avatar: string | null;
  profile_photo_url: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  created_at: string;
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

export default function AgentProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.me, { headers: headers() });
      const data = (await res.json()) as AgentProfile;
      setProfile(data);
      setName(data.name);
      setPhone(data.phone);
      setHomeAddress(data.home_address);
      setBankName(data.bank_name ?? "");
      setAccountNumber(data.account_number ?? "");
      setAccountName(data.account_name ?? "");
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function savePersonal() {
    setSavingPersonal(true);
    try {
      const res = await fetch(AGENT_API.profile, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, home_address: homeAddress }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.message ?? "Failed to save.", "error"); return; }
      setProfile(data.agent);
      toast("Personal info updated.", "success");
      setEditingPersonal(false);
    } catch { toast("Network error.", "error"); }
    setSavingPersonal(false);
  }

  function cancelPersonal() {
    if (!profile) return;
    setName(profile.name);
    setPhone(profile.phone);
    setHomeAddress(profile.home_address);
    setEditingPersonal(false);
  }

  async function saveBank() {
    setSavingBank(true);
    try {
      const res = await fetch(AGENT_API.profile, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ bank_name: bankName, account_number: accountNumber, account_name: accountName }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.message ?? "Failed to save.", "error"); return; }
      setProfile(data.agent);
      toast("Bank details saved.", "success");
      setEditingBank(false);
    } catch { toast("Network error.", "error"); }
    setSavingBank(false);
  }

  function cancelBank() {
    if (!profile) return;
    setBankName(profile.bank_name ?? "");
    setAccountNumber(profile.account_number ?? "");
    setAccountName(profile.account_name ?? "");
    setEditingBank(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(AGENT_API.avatar, { method: "POST", headers: headers(), body: fd });
      const data = await res.json();
      if (!res.ok) { toast("Upload failed.", "error"); return; }
      setProfile((prev) => prev ? { ...prev, avatar: data.url, profile_photo_url: data.url } : prev);
      toast("Photo uploaded.", "success");
    } catch { toast("Network error.", "error"); }
    setUploading(false);
  }

  const initials = profile
    ? profile.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
    : "AG";

  if (loading) return <p className="text-sm text-white/60">Loading...</p>;
  if (!profile) return <p className="text-sm text-white/60">Failed to load profile.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Avatar */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative shrink-0">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-2xl font-bold text-red-400 ring-2 ring-red-500/20">
                {initials}
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs text-white">
                Uploading...
              </span>
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-white">{profile.name}</p>
            <p className="text-sm text-white/60">{profile.email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>
      </div>

      {/* Read-only fields */}
      <div className="rounded-2xl border border-white/15 bg-black/30 divide-y divide-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-white/50">Email</p>
            <p className="mt-1 text-sm text-white/80">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-white/50">Qualification</p>
            <p className="mt-1 text-sm text-white/80">{profile.qualification}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-white/50">Referral Code</p>
            <p className="mt-1 text-lg font-bold tracking-widest text-white">{profile.referral_code}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-white/50">Status</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
              profile.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
            }`}>
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Personal Information</h3>
          {!editingPersonal ? (
            <button onClick={() => setEditingPersonal(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/5 transition">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancelPersonal} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 transition">Cancel</button>
              <button onClick={savePersonal} disabled={savingPersonal} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition">
                {savingPersonal ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50">Full Name</label>
            {editingPersonal ? (
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition" />
            ) : (
              <p className="mt-1 text-sm text-white/80">{profile.name}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-white/50">Phone</label>
            {editingPersonal ? (
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition" />
            ) : (
              <p className="mt-1 text-sm text-white/80">{profile.phone}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-white/50">Home Address</label>
            {editingPersonal ? (
              <textarea value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition resize-none" />
            ) : (
              <p className="mt-1 text-sm text-white/80">{profile.home_address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Bank Details</h3>
          {!editingBank ? (
            <button onClick={() => setEditingBank(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/5 transition">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {profile.bank_name ? "Edit" : "Add Bank Details"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancelBank} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 transition">Cancel</button>
              <button onClick={saveBank} disabled={savingBank} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition">
                {savingBank ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50">Bank Name</label>
            {editingBank ? (
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition placeholder:text-white/30" />
            ) : (
              <p className="mt-1 text-sm text-white/80">{profile.bank_name ?? <span className="text-white/40">Not set</span>}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-white/50">Account Number</label>
            {editingBank ? (
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition placeholder:text-white/30" />
            ) : (
              <p className="mt-1 text-sm text-white/80">{profile.account_number ?? <span className="text-white/40">Not set</span>}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-white/50">Account Name</label>
            {editingBank ? (
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition placeholder:text-white/30" />
            ) : (
              <p className="mt-1 text-sm text-white/80">{profile.account_name ?? <span className="text-white/40">Not set</span>}</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-white/30 text-center">
        Registered {new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
