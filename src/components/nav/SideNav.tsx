"use client";

// The portal sidebar menu, shared by the owner, staff and student sidebars so
// the three always look alike. A group with a `label` is a dropdown (open by
// default, closable, remembered per browser); a group without one is plain
// top-level links. Rows are compact on desktop and taller
// in the phone drawer (the two only ever show at different breakpoints: the
// desktop aside is lg+, the drawer below lg). The current page gets a soft tint.

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import NavIcon, { type IconName } from "./NavIcon";
import { ManualInstallSteps } from "@/components/AppInstallPrompt";
import { isMobileDevice, isStandalone, manualInstallKind, promptInstall, useInstallState } from "@/lib/install-state";

export type NavLinkItem = {
  href: string;
  label: string;
  icon?: IconName;
  /** Plan pill such as "Basic" or "Pro" (caller decides whether it applies). */
  tag?: string;
  /** Unread count, shown as a red bubble. */
  count?: number;
};

export type NavGroup = { label?: string; icon?: IconName; items: NavLinkItem[] };

function Count({ n }: { n: number }) {
  return (
    <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-[#fff]">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="ml-2 shrink-0 rounded-full border border-amber-300/40 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
      {text}
    </span>
  );
}

// Closed dropdowns, remembered in localStorage. Read through
// useSyncExternalStore so the server render (nothing closed) and the first
// client render agree, and the desktop sidebar and phone drawer stay in step.
const CLOSED_EVENT = "sidenav:closed-change";
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; list: string[] }>();

function readClosed(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(`sidenav_closed_${key}`);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.list; // stable reference for React
  let list: string[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) list = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    /* corrupt value: treat as nothing closed */
  }
  cache.set(key, { raw, list });
  return list;
}

function saveClosedGroups(key: string, list: string[]) {
  try {
    localStorage.setItem(`sidenav_closed_${key}`, JSON.stringify(list));
  } catch {
    /* private mode: the toggle just won't be remembered */
  }
  window.dispatchEvent(new Event(CLOSED_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(CLOSED_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CLOSED_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useClosedGroups(key: string): string[] {
  return useSyncExternalStore(subscribe, () => readClosed(key), () => EMPTY);
}

export default function SideNav({
  groups,
  isActive,
  onNavigate,
  storageKey,
}: {
  groups: NavGroup[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  /** Which portal this is ("owner", "staff"…), so each remembers its own dropdowns. */
  storageKey: string;
}) {
  // Dropdowns start open (a mostly-closed sidebar looks empty); whichever ones
  // a person closes stay closed on this browser, per portal.
  const activeGroup = groups.find((g) => g.label && g.items.some((i) => isActive(i.href)))?.label ?? null;
  const closed = useClosedGroups(storageKey);

  const link = (item: NavLinkItem, nested: boolean) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/25 ${
          nested ? "min-h-[40px] lg:min-h-[34px]" : "min-h-[44px] font-medium lg:min-h-[40px]"
        } ${
          active
            ? "bg-white/[0.08] font-medium text-white"
            : `${nested ? "text-white/55" : "text-white/65"} hover:bg-white/[0.05] hover:text-white`
        }`}
      >
        {item.icon && !nested ? <NavIcon name={item.icon} className={`h-[18px] w-[18px] ${active ? "text-white" : "text-white/50"}`} /> : null}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.tag ? <Tag text={item.tag} /> : null}
        {item.count ? <Count n={item.count} /> : null}
      </Link>
    );
  };

  return (
    <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
      {groups.map((group, gi) => {
        if (!group.label) return group.items.map((item) => link(item, false));

        const label = group.label;
        const isOpen = !closed.includes(label);
        const holdsActive = activeGroup === label;
        const unread = group.items.some((i) => (i.count ?? 0) > 0);

        return (
          <div key={label || gi}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => saveClosedGroups(storageKey, isOpen ? [...closed, label] : closed.filter((c) => c !== label))}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors outline-none hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-white/25 lg:min-h-[40px] ${
                holdsActive || isOpen ? "text-white" : "text-white/65"
              }`}
            >
              {group.icon ? <NavIcon name={group.icon} className={`h-[18px] w-[18px] ${holdsActive ? "text-white" : "text-white/50"}`} /> : null}
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {/* Closed: a red dot for unread inside, else a brand dot if the current page is inside. */}
              {!isOpen && unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" /> : null}
              {!isOpen && !unread && holdsActive ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-site-primary" aria-hidden="true" /> : null}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden" inert={!isOpen}>
                <div className="mb-2 ml-[21px] mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                  {group.items.map((item) => link(item, true))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * "Install app" row (above Log Out): installs the academy's own app, on a
 * computer as a desktop app. Always available, unlike the dismissable banner.
 * Chrome / Edge open their install dialog; Safari (iPhone, Mac) shows the
 * manual steps. Hidden inside the installed app, and where the browser offers
 * no way to install (e.g. Firefox).
 */
export function SideNavInstall() {
  const { canPrompt, installed } = useInstallState();
  const [env, setEnv] = useState<{ standalone: boolean; manual: "ios" | "mac-safari" | null; mobile: boolean } | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    (async () => {
      setEnv({ standalone: isStandalone(), manual: manualInstallKind(), mobile: isMobileDevice() });
    })();
  }, []);

  if (!env || env.standalone || installed || (!canPrompt && !env.manual)) return null;

  const label = env.mobile ? "Install app" : "Install desktop app";

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => (canPrompt ? void promptInstall() : setShowSteps((s) => !s))}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/65 outline-none transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-white/25 lg:min-h-[40px]"
      >
        <NavIcon name="install" className="h-[18px] w-[18px] text-white/50" />
        {label}
      </button>
      {showSteps && env.manual ? (
        <div className="mt-1 px-1">
          <ManualInstallSteps kind={env.manual} />
        </div>
      ) : null}
    </div>
  );
}

/** The sidebar's Log Out row, in the same flat style. */
export function SideNavLogout({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 lg:min-h-[36px]"
    >
      <NavIcon name="logout" />
      Log Out
    </button>
  );
}
