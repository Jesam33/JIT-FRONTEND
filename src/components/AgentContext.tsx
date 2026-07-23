"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AGENT_API } from "@/lib/api";

type AgentProfile = {
  name: string;
  email: string;
  referral_code?: string;
  profile_photo_url?: string | null;
};

type AgentContextType = {
  agent: AgentProfile | null;
  loading: boolean;
  refresh: () => void;
};

const AgentContext = createContext<AgentContextType>({ agent: null, loading: true, refresh: () => {} });

export function useAgent() {
  return useContext(AgentContext);
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") ?? "" : "";
}

export function AgentContextProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(AGENT_API.me, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.name) setAgent(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return (
    <AgentContext.Provider value={{ agent, loading, refresh: fetchProfile }}>
      {children}
    </AgentContext.Provider>
  );
}
