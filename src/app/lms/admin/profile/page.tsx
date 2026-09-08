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

type TabKey = "details" | "payment";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Personal details" },
  { key: "payment", label: "Payment & account setup" },
];

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab") === "payment" ? "payment" : "details";
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
                ? "bg-site-primary text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" ? <PersonalDetailsEditor /> : <PayoutSettings />}
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
