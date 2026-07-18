"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/lms/agent/dashboard", label: "Dashboard" },
  { href: "/lms/agent/register-student", label: "Register Student" },
  { href: "/lms/agent/commissions", label: "Commissions" },
  { href: "/lms/agent/notifications", label: "Notifications" },
  { href: "/lms/agent/profile", label: "Profile" },
];

export default function AgentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("lms_agent_token");
    router.push("/lms/agent/login");
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-site-border bg-site-surface p-4">
      <Link href="/lms/agent/dashboard" className="text-lg font-bold tracking-tight text-site-text">
        Agent Portal
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-site-surface-soft text-site-text font-medium" : "text-site-text/60 hover:bg-site-surface-soft hover:text-site-text/80"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <button onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition">
          Logout
        </button>
      </div>
    </aside>
  );
}
