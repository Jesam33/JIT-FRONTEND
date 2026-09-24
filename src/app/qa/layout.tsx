import type { Metadata } from "next";

// Everything under /qa is a one-off testing pass: a signup form and the rooms
// behind it. None of it belongs in a search index, and the join links are
// credentials, so `noindex` is set once here rather than on each page (the
// pages themselves are client components and cannot export metadata).
//
// This is a server component wrapping client children, which is why it exists
// as a layout at all.
export const metadata: Metadata = {
  title: "iungo x Jorsas Tech testing",
  description: "Sign up for an iungo app testing session with Jorsas Tech.",
  robots: { index: false, follow: false },
};

export default function QaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
