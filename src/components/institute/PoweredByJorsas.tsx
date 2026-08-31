import Link from "next/link";

// A subtle "Powered by Jorsas" attribution strip shown at the foot of an
// institute's storefront / course page. It renders only for institutes whose
// plan keeps the badge (the free tier): the backend sends
// `institute.show_powered_by`, which is false once a paid plan unlocks the
// `remove_branding` feature — so callers just guard on that flag. The link nudges
// visitors toward the platform itself.
export default function PoweredByJorsas() {
  return (
    <div className="border-t border-site-border/20 py-6 text-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-site-text/50 transition hover:text-site-text/80"
      >
        Powered by <span className="font-semibold text-site-text/70">Jorsas</span>
      </Link>
    </div>
  );
}
