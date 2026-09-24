"use client";

// Profile, the owner's own account page. Two tabs:
//   • Personal details — the owner's login account (name, email, password)
//   • Payment & account setup — the payout bank + agent commission settings
//     (the old "Course payments" sidebar page, folded in here)
// The tab is deep-linkable via ?tab=payment so the old /lms/admin/payments
// bookmarks land on the right tab. Each tab is its own self-contained editor
// component with its own load/save; this page only owns the heading and the
// tab switcher (same shape as the Customisation page).

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import PersonalDetailsEditor from "@/components/owner/PersonalDetailsEditor";
import PayoutSettings from "@/components/owner/PayoutSettings";
import AccountDangerZone from "@/components/account/AccountDangerZone";
import DevicesCard from "@/components/account/DevicesCard";
import HelpAndPrivacy from "@/components/account/HelpAndPrivacy";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders } from "@/lib/owner-client";

type TabKey = "details" | "payment" | "academy" | "privacy";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Personal details" },
  { key: "payment", label: "Payment & account setup" },
  { key: "academy", label: "Academy status" },
  // Where the owner talks to the PLATFORM: their own data rights (an owner
  // account has no academy-side equivalent) and the devices signed in to it.
  { key: "privacy", label: "Help & privacy" },
];

// Owner components fetch with the owner token directly (ownerAuthHeaders), so
// the shared danger zone gets a fetcher shaped the same way rather than one of
// the student/staff apiFetch wrappers, which would send the wrong token.
function ownerFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { ...ownerAuthHeaders(), ...((options?.headers as Record<string, string>) ?? {}) },
  });
}

function ProfilePageInner() {
  const searchParams = useSearchParams();
  // Any known tab is deep-linkable, not just ?tab=payment: the page grew a
  // fourth tab and hard-coding one accepted value would have made the other two
  // silently land on Personal details.
  const requested = searchParams.get("tab");
  const initial: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : "details";
  const [tab, setTab] = useState<TabKey>(initial);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-site-muted">
          Your account: personal details, sign-in, and how course fees pay out to you.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-full border border-white/15 bg-white/5 p-1 text-sm font-semibold sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-5 py-2 transition sm:flex-none ${
              tab === t.key
                ? "bg-site-primary text-[#fff]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <PersonalDetailsEditor />
      ) : tab === "payment" ? (
        <PayoutSettings />
      ) : tab === "privacy" ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Help &amp; privacy</h2>
            <p className="mt-1 text-sm text-site-muted">
              Ask Jorsas Tech about your data, and see where your account is signed in.
            </p>
          </div>

          {/* Owner wording, not the student wording: a request from here names
              the academy as well as the login, and it is answered by the platform
              rather than by the academy. There is no "report your academy" card —
              an owner has no academy above them to report. */}
          <HelpAndPrivacy
            fetcher={ownerFetch}
            rightsEndpoint={OWNER_API.rightsRequest}
            audience="owner"
          />

          <DevicesCard
            fetcher={ownerFetch}
            listEndpoint={OWNER_API.devices}
            signOutEndpoint={OWNER_API.deviceSignOut}
            signOutAllEndpoint={OWNER_API.devicesSignOutEverywhere}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Academy status</h2>
            <p className="mt-1 text-sm text-site-muted">
              Take your academy off the market, close it, or bring it back.
            </p>
          </div>

          {/* The owner's deactivate/reactivate act on the ACADEMY, not on their own
              login: their account has no separate state. Deactivating keeps every
              student and staffer working and only stops new business. */}
          <AccountDangerZone
            scope="academy"
            endpoints={{
              show: OWNER_API.academyLifecycle,
              deactivate: OWNER_API.academyDeactivate,
              reactivate: OWNER_API.academyReactivate,
              cancelDeletion: OWNER_API.academyReactivate,
              // No `remove`: closing an academy permanently is the platform's
              // call (Jorsas, from the host admin), so the component simply does
              // not offer it rather than pointing at an endpoint that would 404.
            }}
            fetcher={ownerFetch}
          />
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}
