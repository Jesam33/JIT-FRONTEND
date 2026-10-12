"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearOwnerToken } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";
import { academyLabel, type OwnerBranding } from "@/lib/owner-branding";
import SideNav, { SideNavLogout, type NavGroup } from "@/components/nav/SideNav";
import type { IconName } from "@/components/nav/NavIcon";

export type OwnerIdentity = {
  name?: string | null;
  slug?: string | null;
  email?: string | null;
  plan?: string | null;
  // Live plan feature flags (from plan_summary.features). Used to hide a paid-tier
  // badge once the current plan already includes that feature.
  features?: Record<string, boolean> | null;
  branding?: OwnerBranding | null;
};

// A per-item `badge` (e.g. "Pro") is a small pill after the label, used to mark a
// paid-tier entry that stays VISIBLE to every plan (clicking it on a lower plan hits
// the backend gate → 402 → UpgradeModal), rather than being hidden. When the item
// names a `gatedFeature`, the badge is dropped once the current plan includes it, 
// so an owner already on Pro doesn't see a "Pro" tag on a feature they now own.
type SidebarItem = { href: string; label: string; icon?: IconName; badge?: string; gatedFeature?: string };

// A group with a `label` is a dropdown (one open at a time; the one holding the
// current page opens by itself). A group without one is plain top-level links.
// Rendering lives in components/nav/SideNav (shared with staff + student).
type SidebarGroup = {
  label?: string;
  icon?: IconName;
  items: SidebarItem[];
};

// Institute-scoped navigation: Dashboard, then dropdowns for students, the
// owner's Teaching area (split into three so none is a wall of links), staff
// and settings.
const groups: SidebarGroup[] = [
  {
    items: [{ href: "/lms/admin", label: "Dashboard", icon: "home" }],
  },
  {
    label: "Students",
    icon: "users",
    items: [
      { href: "/lms/admin/students", label: "All Students" },
      { href: "/lms/admin/courses", label: "Courses" },
      { href: "/lms/admin/tracks", label: "Tracks & Cohorts" },
      { href: "/lms/admin/one-on-one", label: "One-on-one", badge: "Basic", gatedFeature: "one_on_one" },
      { href: "/lms/admin/certificates", label: "Certificates" },
      { href: "/lms/admin/reviews", label: "Reviews" },
    ],
  },
  // The owner's Teaching area: the staff portal's own features, re-implemented
  // inside the admin portal at /lms/admin/teaching/* so the owner never has to
  // leave it. The backend accepts the owner token on every staff endpoint and
  // scopes it to the WHOLE academy (BaseLmsController::staffActor +
  // actorCourseIds), so these pages cover every course and cohort.
  {
    label: "Teaching",
    icon: "graduation",
    items: [
      { href: "/lms/admin/teaching/app", label: "Teaching dashboard" },
      { href: "/lms/admin/teaching/classroom", label: "Classroom" },
      { href: "/lms/admin/teaching/timetable", label: "Timetable" },
      { href: "/lms/admin/teaching/attendance", label: "Attendance" },
      { href: "/lms/admin/teaching/leaderboard", label: "Leaderboard" },
      { href: "/lms/admin/teaching/reports", label: "Reports" },
    ],
  },
  {
    label: "Content",
    icon: "book",
    items: [
      { href: "/lms/admin/teaching/modules", label: "Modules" },
      { href: "/lms/admin/teaching/materials", label: "Materials" },
      // Visible to every plan; the Gamma generator itself is Pro+ (the page shows
      // the upgrade prompt). The badge hides once the plan includes ai_materials.
      { href: "/lms/admin/ai-materials", label: "Create with AI", badge: "Pro", gatedFeature: "ai_materials" },
      { href: "/lms/admin/teaching/tasks", label: "Tasks" },
      { href: "/lms/admin/teaching/quizzes", label: "Quizzes", badge: "Basic", gatedFeature: "quizzes" },
    ],
  },
  {
    label: "Communication",
    icon: "message",
    items: [
      // Chat is a paid-plan feature and its endpoints 402 on a plan without it
      // (EnsureChatEnabled), so it carries the badge like Agents does.
      { href: "/lms/admin/teaching/chats", label: "Chats", badge: "Basic", gatedFeature: "chat" },
      { href: "/lms/admin/teaching/notifications", label: "Notifications" },
      { href: "/lms/admin/teaching/announcements", label: "Announcements" },
    ],
  },
  {
    label: "Staff",
    icon: "briefcase",
    items: [
      { href: "/lms/admin/staff", label: "Staff Accounts" },
      // Admission Marketer network (Basic+): every agent advertising the academy,
      // their referrals and payout balance. Stays visible on every plan (402 →
      // UpgradeModal), the badge drops once the plan includes it.
      { href: "/lms/admin/agents", label: "Agents", badge: "Basic", gatedFeature: "admission_marketer" },
    ],
  },
  {
    items: [{ href: "/lms/admin/forum", label: "CEO's Forum", icon: "forum" }],
  },
  {
    label: "Settings",
    icon: "sliders",
    items: [
      { href: "/lms/admin/branding", label: "Customisation" },
      { href: "/lms/admin/domains", label: "Custom domain", badge: "Pro", gatedFeature: "custom_domain" },
      { href: "/lms/admin/billing", label: "Billing & Plan" },
      // The owner's own account (personal details + payout setup). The payout
      // tab absorbed the old "Course payments" sidebar entry.
      { href: "/lms/admin/profile", label: "Profile" },
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
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-primary text-sm font-bold text-[#fff] ring-1 ring-white/20">
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

// The plan card at the foot of the sidebar: which plan the academy is on, one
// line on what the next tier adds, and a way into Billing & Plan.
function PlanCard({ plan, onNavigate }: { plan?: string | null; onNavigate?: () => void }) {
  // Nothing until the plan has loaded, so a Pro academy never flashes "Free".
  if (!plan) return null;
  const key = plan.toLowerCase();
  const top = key === "pro" || key === "enterprise";
  const name = key.charAt(0).toUpperCase() + key.slice(1);
  const blurb =
    key === "free"
      ? "Upgrade to unlock live classes, chat, quizzes and more."
      : key === "basic"
        ? "Go Pro for AI materials and your own domain."
        : "Every feature is unlocked for your academy.";

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Your plan</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{name} plan</p>
      <p className="mt-1 text-xs leading-relaxed text-white/55">{blurb}</p>
      <Link
        href="/lms/admin/billing"
        onClick={onNavigate}
        className={`mt-3 flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
          top ? "border border-white/15 text-white hover:bg-white/10" : "bg-site-primary text-[#fff] hover:brightness-110"
        }`}
      >
        {top ? "Manage plan" : "Upgrade"}
      </Link>
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
    // Dashboard is the index, active only on an exact match so it doesn't
    // light up for every /lms/admin/* child route.
    if (href === "/lms/admin") return pathname === "/lms/admin";
    return pathname.startsWith(href);
  }

  // Plan pills drop once the current plan includes the feature.
  const navGroups: NavGroup[] = groups.map((g) => ({
    label: g.label,
    icon: g.icon,
    items: g.items.map((i) => ({
      href: i.href,
      label: i.label,
      icon: i.icon,
      tag: i.badge && !(i.gatedFeature && identity?.features?.[i.gatedFeature]) ? i.badge : undefined,
    })),
  }));

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col self-start rounded-2xl border border-white/20 bg-[#0b0b0b]/95 p-5 max-lg:hidden">
        <div className="mb-5">
          <IdentityCard identity={identity} />
        </div>
        <SideNav storageKey="owner" groups={navGroups} isActive={isActive} />
        <div className="mt-4">
          <PlanCard plan={identity?.plan} />
        </div>
        <div className="border-t border-white/10 pt-3">
          <SideNavLogout onClick={handleLogout} />
        </div>
      </aside>

      {/* MOBILE + TABLET */}
      <div className="lg:hidden">
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
              <SideNav storageKey="owner" groups={navGroups} isActive={isActive} onNavigate={() => setOpen(false)} />
              <div className="mt-4">
                <PlanCard plan={identity?.plan} onNavigate={() => setOpen(false)} />
              </div>
              <div className="border-t border-white/10 pt-3">
                <SideNavLogout onClick={() => { setOpen(false); handleLogout(); }} />
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
