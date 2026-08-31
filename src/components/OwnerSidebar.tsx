"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearOwnerToken } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";
import { academyLabel, type OwnerBranding } from "@/lib/owner-branding";

export type OwnerIdentity = {
  name?: string | null;
  slug?: string | null;
  email?: string | null;
  plan?: string | null;
  branding?: OwnerBranding | null;
};

// A per-item `badge` (e.g. "Pro") is a small pill after the label — used to mark a
// paid-tier entry that stays VISIBLE to every plan (clicking it on a lower plan hits
// the backend gate → 402 → UpgradeModal), rather than being hidden.
type SidebarItem = { href: string; label: string; badge?: string };

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

// Institute-scoped navigation, echoing the reference admin panel: a top-level
// Dashboard, then grouped operations for students / staff, then settings.
const groups: SidebarGroup[] = [
  {
    label: "Menu",
    items: [{ href: "/lms/admin", label: "Dashboard" }],
  },
  {
    label: "Student operations",
    items: [
      { href: "/lms/admin/students", label: "All Students" },
      { href: "/lms/admin/courses", label: "Courses" },
      { href: "/lms/admin/tracks", label: "Tracks & Cohorts" },
      { href: "/lms/admin/certificates", label: "Certificates" },
    ],
  },
  {
    label: "Content tools",
    // Visible to every plan; the Gamma generator itself is Pro+ (the page shows the
    // upgrade prompt when a lower-plan owner tries to generate).
    items: [{ href: "/lms/admin/ai-materials", label: "Create with AI", badge: "Pro" }],
  },
  {
    label: "Staff operations",
    items: [{ href: "/lms/admin/staff", label: "Staff Accounts" }],
  },
  {
    label: "Settings",
    items: [
      { href: "/lms/admin/branding", label: "Customization" },
      { href: "/lms/admin/profile", label: "Public page" },
      { href: "/lms/admin/payments", label: "Course payments" },
      { href: "/lms/admin/billing", label: "Billing & Plan" },
    ],
  },
];

function IdentityCard({ identity }: { identity: OwnerIdentity | null }) {
  const label = academyLabel(identity?.branding).singular;
  const name = identity?.name || `Your ${label}`;
  const logo = identity?.branding?.logo_url;
  const initials = (identity?.name || "In")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          className="h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-white/20"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-primary text-sm font-bold text-white ring-1 ring-white/20">
          {initials}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="truncate text-[11px] text-white/55">
          {identity?.email || `${label} owner`}
        </p>
      </div>
      {identity?.plan && (
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {identity.plan}
        </span>
      )}
    </div>
  );
}

export default function OwnerSidebar({
  identity,
}: {
  identity: OwnerIdentity | null;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    clearOwnerToken();
    router.push(tenantLoginPath("owner"));
  };

  function isActive(href: string) {
    // Dashboard is the index — active only on an exact match so it doesn't
    // light up for every /lms/admin/* child route.
    if (href === "/lms/admin") return pathname === "/lms/admin";
    return pathname.startsWith(href);
  }

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 space-y-5 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClick}
                className={`flex min-h-[44px] items-center rounded-xl border px-4 py-2.5 text-sm transition ${
                  isActive(item.href)
                    ? "border-white/18 bg-white/12 text-white shadow-[0_12px_30px_rgba(255,255,255,0.08)]"
                    : "border-white/6 bg-white/5 text-white/80 hover:border-white/12 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="ml-2 shrink-0 rounded-full border border-amber-300/40 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const LogoutButton = ({ onClick }: { onClick?: () => void }) => (
    <button
      onClick={() => {
        onClick?.();
        handleLogout();
      }}
      className="flex min-h-[48px] w-full items-center rounded-xl border border-white/6 bg-white/5 px-4 py-3 text-sm text-red-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3 shrink-0">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Log Out
    </button>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-2xl border border-white/20 bg-[#0b0b0b]/95 p-5 max-md:hidden lg:min-h-[760px]">
        <div className="mb-5">
          <IdentityCard identity={identity} />
        </div>
        <NavList />
        <div className="mt-6 border-t border-white/10 pt-4">
          <LogoutButton />
        </div>
      </aside>

      {/* MOBILE */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="min-w-0 flex-1">
            <IdentityCard identity={identity} />
          </div>
          <button
            type="button"
            aria-label="Open admin menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50">
            <button className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-label="Close menu backdrop" />
            <aside className="absolute left-0 top-0 flex h-full w-[min(320px,88vw)] flex-col border-r border-white/15 bg-[#0b0b0b] px-5 pb-6 pt-5 text-white shadow-2xl">
              <div className="mb-5 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <IdentityCard identity={identity} />
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/5 transition hover:bg-white/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <NavList onClick={() => setOpen(false)} />
              <div className="mt-6 border-t border-white/10 pt-4">
                <LogoutButton onClick={() => setOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
