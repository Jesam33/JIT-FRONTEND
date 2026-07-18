"use client";

import { useEffect, useState, useRef } from "react";
import { STAFF_API } from "../../../../lib/api";

type Profile = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  profile_photo_url?: string;
};

type Tab = "basic-info" | "change-password";

const tabs: { key: Tab; label: string }[] = [
  { key: "basic-info", label: "Basic Info" },
  { key: "change-password", label: "Change Password" },
];

export default function StaffProfilePage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("basic-info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetch(STAFF_API.profile, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setPhotoUrl(data.profile_photo_url ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  async function saveProfile() {
    setSaving(true); setMessage("");
    const res = await fetch(STAFF_API.profile, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, phone: phone || null, profile_photo_url: photoUrl || null }),
    });
    const data = await res.json();
    if (res.ok) { setMessage("Profile updated."); if (data.teacher) setProfile((prev) => prev ? { ...prev, ...data.teacher } : prev); }
    else { setMessage(data.message ?? "Failed to update."); }
    setSaving(false);
  }

  async function changePassword() {
    setPasswordMessage("");
    const res = await fetch(STAFF_API.changePassword, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    setPasswordMessage(data.message ?? (res.ok ? "Password changed." : "Failed."));
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(STAFF_API.profilePhoto, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (res.ok && data.url) { setPhotoUrl(data.url); setProfile((prev) => prev ? { ...prev, profile_photo_url: data.url } : prev); }
  }

  const initials = profile ? profile.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "??";

  if (loading) {
    return (
      <section className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold capitalize">{activeTab === "basic-info" ? "Basic info" : "Change Password"}</h1>
        <p className="mt-1 text-sm text-white/60">Edit and update your profile</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My profile
          </div>
          <nav className="space-y-1">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${activeTab === t.key ? "bg-white/10 text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          {activeTab === "basic-info" && (
            <>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {photoUrl ? (
                      <img src={photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white/70">{initials}</span>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black text-white/70 hover:text-white transition" title="Upload photo">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{name}</p>
                    <p className="text-sm text-white/60">{email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Personal Information</h3>
                  <button onClick={saveProfile} disabled={saving} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:text-white hover:border-white/40 transition disabled:opacity-50">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
                {message ? <p className={`mb-4 text-sm ${message === "Profile updated." ? "text-green-400" : "text-red-400"}`}>{message}</p> : null}
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Email Address</label>
                    <input value={email} disabled className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/60" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Phone Number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "change-password" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-4">Change Password</h3>
              {passwordMessage ? <p className={`mb-4 text-sm ${passwordMessage === "Password changed." || passwordMessage === "Password changed successfully." ? "text-green-400" : "text-red-400"}`}>{passwordMessage}</p> : null}
              <div className="max-w-sm space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-white/50">Current Password</label>
                  <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">New Password</label>
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 8 characters" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                </div>
                <button onClick={changePassword} disabled={!currentPassword || !newPassword} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50 hover:bg-white/90 transition">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
