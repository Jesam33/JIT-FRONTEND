"use client";

import { useCallback, useEffect, useState } from "react";
import { AGENT_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type AgentProfile = {
  name: string; email: string; phone: string; home_address: string;
  qualification: string; referral_code: string; status: string; created_at: string;
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : ""; }
function headers() { return { Authorization: `Bearer ${getToken()}` }; }

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(AGENT_API.me, { headers: headers() });
      setProfile(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-site-text/60">Loading...</p>;
  if (!profile) return <p className="text-site-text/60">Failed to load profile.</p>;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold">Profile</h2>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs text-site-text/50">Name</p>
          <p className="text-sm font-medium">{profile.name}</p>
        </div>
        <div>
          <p className="text-xs text-site-text/50">Email</p>
          <p className="text-sm">{profile.email}</p>
        </div>
        <div>
          <p className="text-xs text-site-text/50">Phone</p>
          <p className="text-sm">{profile.phone}</p>
        </div>
        <div>
          <p className="text-xs text-site-text/50">Address</p>
          <p className="text-sm">{profile.home_address}</p>
        </div>
        <div>
          <p className="text-xs text-site-text/50">Qualification</p>
          <p className="text-sm">{profile.qualification}</p>
        </div>
        <div>
          <p className="text-xs text-site-text/50">Referral Code</p>
          <p className="text-lg font-bold tracking-widest text-site-text">{profile.referral_code}</p>
        </div>
        <div>
          <p className="text-xs text-site-text/50">Status</p>
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs ${
            profile.status === "approved" ? "bg-red-500/20 text-red-200" : "bg-amber-500/20 text-amber-200"
          }`}>{profile.status}</span>
        </div>
      </div>
    </div>
  );
}
