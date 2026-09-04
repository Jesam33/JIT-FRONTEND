"use client";

// Customisation — the single owner-facing page for everything that shapes how
// this academy looks to the outside world. It merges what used to be two sidebar
// entries ("Customization" and "Public page") into one page with two tabs:
//   • Branding    — entity label, name, logo, colors, background, font
//   • Public page — cover image, intro, contact details, social links
// Each tab is its own self-contained editor component (with its own load/save);
// this page only owns the heading and the tab switcher. The "Public page" entry
// was removed from the sidebar — /lms/admin/profile now redirects here.

import { useState } from "react";
import BrandingEditor from "@/components/owner/BrandingEditor";
import PublicPageEditor from "@/components/owner/PublicPageEditor";

type TabKey = "branding" | "public";

const TABS: { key: TabKey; label: string }[] = [
  { key: "branding", label: "Branding" },
  { key: "public", label: "Public page" },
];

export default function CustomisationPage() {
  const [tab, setTab] = useState<TabKey>("branding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customisation</h1>
        <p className="mt-1 text-sm text-site-muted">
          Make it yours: your branding and the public page prospective students see before they enrol.
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

      {tab === "branding" ? <BrandingEditor /> : <PublicPageEditor />}
    </div>
  );
}
