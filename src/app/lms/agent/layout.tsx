"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AgentContextProvider } from "../../../components/AgentContext";
import AgentSidebar from "../../../components/AgentSidebar";
import LmsNavbar from "../../../components/LmsNavbar";
import ToastProvider from "../../../components/ToastProvider";
import ErrorBoundary from "../../../components/ErrorBoundary";
import IdleLogout from "../../../components/IdleLogout";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const publicPaths = ["/lms/agent/login", "/lms/agent/forgot-password", "/lms/agent/reset-password"];
  const isPublicPage = publicPaths.includes(pathname);

  useEffect(() => {
    if (isPublicPage) { setReady(true); return; }
    const token = localStorage.getItem("lms_agent_token");
    if (!token) { router.replace("/lms/agent/login"); return; }
    setReady(true);
  }, [router, isPublicPage]);

  if (!ready) return null;
  if (isPublicPage) return <>{children}</>;

  return (
    <AgentContextProvider>
      <ToastProvider>
        <IdleLogout tokenKeys={["lms_agent_token"]} redirectTo="/lms/agent/login" />
        <div className="section-divider pt-6">
          <div className="container-wide grid items-start gap-4 md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <AgentSidebar />
            <main className="relative min-w-0 pb-8">
              <LmsNavbar
                portalName="Agent Portal"
                bellHref="/lms/agent/notifications"
                placeholder="Search commissions or students..."
              />
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AgentContextProvider>
  );
}
