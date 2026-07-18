"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { STUDENT_API } from "../../../../lib/api";
import type { StudentProfile } from "../../../../lib/lms-types";

type Tab = "basic-info" | "professional-details" | "change-password";

const tabs: { key: Tab; label: string }[] = [
  { key: "basic-info", label: "Basic Info" },
  { key: "professional-details", label: "Professional Details" },
  { key: "change-password", label: "Change Password" },
];

export default function ProfilePage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_student_token") ?? "" : "";

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("basic-info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notifyClass, setNotifyClass] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifyAnnounce, setNotifyAnnounce] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    const res = await fetch(STUDENT_API.profile, { headers: { Authorization: `Bearer ${token}` } });
    const data: StudentProfile = await res.json();
    setProfile(data);
    setFirstName(data.first_name ?? "");
    setLastName(data.last_name ?? "");
    setEmail(data.email ?? "");
    setDob(data.date_of_birth ?? "");
    setPhone(data.phone ?? "");
    setGender(data.gender ?? "");
    setPhotoUrl(data.profile_photo_url ?? "");
    setNotifyClass(data.notify_class_reminders);
    setNotifyChat(data.notify_chat);
    setNotifyAnnounce(data.notify_announcements);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function saveProfile() {
    setSaving(true); setMessage("");
    const res = await fetch(STUDENT_API.profile, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, date_of_birth: dob || null, phone: phone || null, gender: gender || null, profile_photo_url: photoUrl || null, notify_class_reminders: notifyClass, notify_chat: notifyChat, notify_announcements: notifyAnnounce }),
    });
    const data = await res.json();
    if (res.ok) { setMessage("Profile updated."); if (data.profile) setProfile((prev) => prev ? { ...prev, ...data.profile } : prev); }
    else { setMessage(data.message ?? "Failed to update."); }
    setSaving(false);
  }

  async function changePassword() {
    setPasswordMessage("");
    const res = await fetch(STUDENT_API.changePassword, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, new_password_confirmation: confirmNewPassword }),
    });
    const data = await res.json();
    setPasswordMessage(data.message ?? (res.ok ? "Password changed." : "Failed."));
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword(""); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(STUDENT_API.profilePhoto, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (res.ok && data.url) { setPhotoUrl(data.url); setProfile((prev) => prev ? { ...prev, profile_photo_url: data.url } : prev); }
  }

  const initials = profile ? (profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "") : "??";
  const referralCode = profile?.referral_code ?? "";

  if (loading) {
    return (
      <section className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">{activeTab === "basic-info" ? "Basic info" : activeTab === "professional-details" ? "Professional Details" : "Change Password"}</h1>
          <p className="mt-1 text-sm text-white/60">Edit and update your profile</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.course_title ? <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">{profile.course_title}</span> : null}
          {profile?.track_name ? <span className="text-xs text-white/50">{profile.track_name}</span> : null}
        </div>
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
          <div className="mt-4 border-t border-white/10 pt-4">
            <button className="flex w-full items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-600/30 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              View Certificate
            </button>
          </div>
          {referralCode ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Referral Code</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">{referralCode}</span>
                <button onClick={() => navigator.clipboard.writeText(referralCode)} className="text-white/40 hover:text-white/70 transition" title="Copy">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="flex-1 space-y-6">
          {activeTab === "basic-info" && (
            <>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-start justify-between">
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
                      <p className="text-lg font-semibold">{firstName} {lastName}</p>
                      <p className="text-sm text-white/60">{email}</p>
                    </div>
                  </div>
                  <button onClick={() => document.getElementById("personal-info-form")?.scrollIntoView({ behavior: "smooth" })} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:text-white hover:border-white/40 transition">Edit</button>
                </div>
              </div>

              <div id="personal-info-form" className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Personal Information</h3>
                  <button onClick={saveProfile} disabled={saving} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:text-white hover:border-white/40 transition disabled:opacity-50">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
                {message ? <p className={`mb-4 text-sm ${message === "Profile updated." ? "text-green-400" : "text-red-400"}`}>{message}</p> : null}
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/50">First Name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Last Name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Email Address</label>
                    <input value={email} disabled className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/60" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Date of Birth</label>
                    <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Phone Number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Referred By</label>
                    <input value="" disabled placeholder="Not referred" className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/40" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Referral Code</label>
                    <input value={referralCode} disabled className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/60" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
                    <span className="text-sm">Class reminders</span>
                    <input type="checkbox" checked={notifyClass} onChange={(e) => setNotifyClass(e.target.checked)} className="accent-white" />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
                    <span className="text-sm">Chat notifications</span>
                    <input type="checkbox" checked={notifyChat} onChange={(e) => setNotifyChat(e.target.checked)} className="accent-white" />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
                    <span className="text-sm">Announcements</span>
                    <input type="checkbox" checked={notifyAnnounce} onChange={(e) => setNotifyAnnounce(e.target.checked)} className="accent-white" />
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === "professional-details" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-4">Professional Details</h3>
              <p className="text-sm text-white/60">Coming soon.</p>
            </div>
          )}

          {activeTab === "change-password" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-4">Change Password</h3>
              {passwordMessage ? <p className={`mb-4 text-sm ${passwordMessage === "Password updated successfully." || passwordMessage === "Password changed." ? "text-green-400" : "text-red-400"}`}>{passwordMessage}</p> : null}
              <div className="max-w-sm space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-white/50">Current Password</label>
                  <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">New Password</label>
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 8 characters" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Confirm New Password</label>
                  <input value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} type="password" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                </div>
                <button onClick={changePassword} disabled={!currentPassword || !newPassword || !confirmNewPassword} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50 hover:bg-white/90 transition">
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
