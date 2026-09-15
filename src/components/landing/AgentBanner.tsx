import Link from "next/link";

// The agent-program promo on the academy storefront. Deliberately NOT a big
// banner: a slim, clickable text line so it never competes with the hero or
// the course cards, just a persistent, quiet invitation to earn.
// `tenantSlug` scopes the link to a specific academy's agent program
// (/become-an-agent?tenant={slug}), so a visitor who applies from an academy's
// storefront is onboarded as THAT academy's agent. Absent (the apex Jorsas
// /institute banner) it links to the plain primary program, unchanged.
export default function AgentBanner({ tenantSlug }: { tenantSlug?: string }) {
  const applyHref = tenantSlug
    ? `/become-an-agent?tenant=${encodeURIComponent(tenantSlug)}`
    : "/become-an-agent";
  return (
    <Link
      href={applyHref}
      className="group flex items-center gap-2.5 rounded-full border border-site-border/30 bg-site-surface-soft px-5 py-2.5 text-sm transition hover:border-site-border/60 hover:bg-site-surface"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-site-text/50">
        Earn with us
      </span>
      <span className="font-medium text-site-text/85 transition group-hover:text-site-text">
        Become an Admission Marketer
      </span>
      <span
        aria-hidden="true"
        className="font-semibold transition group-hover:translate-x-0.5"
        style={{ color: "var(--color-primary)" }}
      >
        ↗
      </span>
    </Link>
  );
}
