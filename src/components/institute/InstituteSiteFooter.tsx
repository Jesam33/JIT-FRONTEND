// The slim footer that closes every per-institute mini-site (/i/{slug} and its
// course pages). The rich "Get in touch" block (contact rows + socials) is
// already rendered inside the page body by InstituteContactFooter; this is just
// the final bar: the institute's own copyright, plus a quiet "Powered by Jorsas
// Tech" credit. That credit is the ONE acceptable link back to jorsastech: fine
// print that opens in a new tab, never a nav item that would bounce a visitor
// off the institute's site (the whole complaint we're fixing). It is the single
// attribution on the mini-site (the old standalone PoweredByJorsas strip was
// removed as a duplicate) and is gated on `show_powered_by`, so a paid plan with
// remove_branding drops it entirely.

type InstituteSiteFooterProps = {
  institute: { name: string; slug: string; show_powered_by?: boolean };
};

export default function InstituteSiteFooter({ institute }: InstituteSiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-site-border/20 py-8">
      <div className="container-wide flex flex-col items-center justify-between gap-3 text-center text-sm text-site-text/55 sm:flex-row sm:text-left">
        <p>
          © {year} {institute.name}. All rights reserved.
        </p>
        {institute.show_powered_by ? (
          <a
            href="https://jorsastech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-site-text/45 transition hover:text-site-text/70"
          >
            Powered by Jorsastech
          </a>
        ) : null}
      </div>
    </footer>
  );
}
