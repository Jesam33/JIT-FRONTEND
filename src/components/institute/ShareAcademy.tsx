"use client";

import { useEffect, useState } from "react";

// "Share your experience" row on the academy storefront: lets a student (or
// any visitor) post the academy to their socials — WhatsApp, X, Facebook, the
// device's native share sheet (falls back to copy on desktop), or a plain
// copy-link. Pure links (no tracking pixels), the share URLs just prefill the
// visitor's own post with the academy's name + URL.
export default function ShareAcademy({ academyName, url }: { academyName: string; url: string }) {
  const [copied, setCopied] = useState(false);
  // Resolved post-mount (not during render) so SSR and the first client paint
  // agree — computing `new URL(...)` inline would send a relative href from
  // the server and an absolute one from the browser = hydration mismatch.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // The page passes its path ("/i/{slug}" or "/institute"); resolve it against
  // the origin the visitor is actually on, so academy subdomains and custom
  // domains share their own URL, never a hardcoded host.
  const absoluteUrl = origin ? new URL(url, origin).toString() : url;

  const text = `I'm learning at ${academyName} — practical, career-focused courses you can join from anywhere. Check them out:`;

  // Each service gets its share URL; encodeURIComponent on every piece.
  const encText = encodeURIComponent(text);
  const encUrl = encodeURIComponent(absoluteUrl);
  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encText}%20${encUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 019.88 9.89c0 5.45-4.44 9.88-9.89 9.88zm8.42-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.47-8.41z" />
        </svg>
      ),
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-7.53 8.6L23 22h-6.8l-5-6.55L5.42 22H2.3l8.05-9.2L1 2h6.97l4.52 5.98L18.9 2zm-1.2 18h1.68L7.36 3.72H5.56L17.7 20z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
        </svg>
      ),
    },
  ];

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: academyName, text, url: absoluteUrl });
      } catch {
        /* user dismissed the sheet — nothing to do */
      }
    } else {
      await copyLink();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the socials links still work */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-site-text/50">
        Share your experience
      </span>
      <div className="flex items-center gap-2">
        {shareLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${s.label}`}
            title={`Share on ${s.label}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-site-border/30 bg-site-surface-soft text-site-text/70 transition hover:border-site-border/60 hover:bg-site-surface hover:text-site-text"
          >
            {s.icon}
          </a>
        ))}
        <button
          type="button"
          onClick={nativeShare}
          aria-label="Share"
          title="Share"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-site-border/30 bg-site-surface-soft text-site-text/70 transition hover:border-site-border/60 hover:bg-site-surface hover:text-site-text"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          title="Copy link"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-site-border/30 bg-site-surface-soft text-site-text/70 transition hover:border-site-border/60 hover:bg-site-surface hover:text-site-text"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
