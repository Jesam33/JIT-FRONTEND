"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgentSidebar from "../../../components/AgentSidebar";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("lms_agent_token");
    if (!token) { router.replace("/lms/agent/login"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex h-screen bg-site-bg text-site-text">
      <AgentSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
