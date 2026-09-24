"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { QA_API } from "@/lib/api";
import QaSignupForm from "@/components/qa/QaSignupForm";
import { qaBrandName, qaPrettyDate, type QaEventInfo, type QaSlotInfo } from "@/components/qa/types";

// Public signup for a QA testing pass, as a standalone page. The same form is
// also offered as a popup on the marketing site (see QaPopup); this page is the
// link the iungo team can share directly, and what the popup points at when
// someone wants more room than a modal gives them.
//
// This route sits OUTSIDE /lms/app and outside /i/{slug}, so it renders bare: no
// portal sidebar and no Jorsas marketing chrome (see AppChrome). The page carries
// the co-branding itself, which is the point: the testers are not Jorsas
// customers and should not be handed a navbar full of Jorsas products.
//
// There is no account here on purpose. Name, email and phone go in, a join link
// comes out, and the link in their inbox is the only credential.

type Phase = "loading" | "ready" | "closed" | "missing" | "error" | "done";

export default function QaRegisterPage() {
  const { event: slugParam } = useParams<{ event: string }>();
  const slug = typeof slugParam === "string" ? slugParam : "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [event, setEvent] = useState<QaEventInfo | null>(null);
  const [slots, setSlots] = useState<QaSlotInfo[]>([]);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");

  /**
   * Load the event and its open sessions.
   *
   * Callable rather than living inside the mount effect because the form needs it
   * too: a session that fills up between page load and submit leaves the picker
   * showing a session that no longer exists, so the useful response is to reload
   * the list rather than only report the failure.
   */
  const loadEvent = useCallback(async (): Promise<boolean> => {
    if (!slug) {
      setPhase("missing");
      return false;
    }

    // Plain fetch, not apiFetch: that helper redirects to a portal login on a
    // 401, and there is no portal for a tester to be sent to.
    try {
      const res = await fetch(QA_API.event(slug));
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setPhase("missing");
        return false;
      }
      if (!res.ok) {
        setNotice(data?.message ?? "");
        setPhase("error");
        return false;
      }

      const found = data.event as QaEventInfo;
      setEvent(found);
      setSlots(((data.slots ?? []) as QaSlotInfo[]).filter((s) => s.is_open));
      setPhase(found?.is_open ? "ready" : "closed");
      return true;
    } catch {
      setPhase("error");
      return false;
    }
  }, [slug]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const brand = qaBrandName(event);
  const when = useMemo(() => qaPrettyDate(event?.starts_at), [event]);

  return (
    <div className="min-h-dvh bg-site-bg px-4 py-10 text-site-text sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <BrandLockup brand={brand} />

        {phase === "loading" ? (
          <Card>
            <p className="text-sm text-site-muted">Loading the testing schedule...</p>
          </Card>
        ) : null}

        {phase === "missing" ? (
          <Card>
            <h1 className="text-xl font-semibold">This testing page is not available</h1>
            <p className="mt-3 text-sm text-site-muted">
              The link may be out of date, or the testing day has been taken down. Ask the team who invited you for the current link.
            </p>
          </Card>
        ) : null}

        {phase === "error" ? (
          <Card>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-3 text-sm text-site-muted">{notice || "Please reload the page and try again."}</p>
          </Card>
        ) : null}

        {phase === "closed" ? (
          <Card>
            <h1 className="text-xl font-semibold">Signups have closed</h1>
            <p className="mt-3 text-sm text-site-muted">
              Testing for {brand} is no longer taking new testers. If you already signed up, use the link we emailed you.
            </p>
          </Card>
        ) : null}

        {phase === "done" ? (
          <Card>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-site-primary/15 text-2xl text-site-primary">✓</div>
            <h1 className="mt-4 text-xl font-semibold">You are on the list</h1>
            <p className="mt-3 text-sm text-site-muted">
              We sent your join link to <span className="font-medium text-site-text">{email}</span>. Open it at your session time and you
              will go straight into the room, no password needed.
            </p>
            <p className="mt-3 text-sm text-site-muted">
              Nothing in your inbox after a few minutes? Check spam first, then fill this form again with the same email and we will send a
              fresh link.
            </p>
          </Card>
        ) : null}

        {phase === "ready" ? (
          <>
            <Card>
              <h1 className="text-2xl font-semibold leading-tight">{event?.name}</h1>
              {when ? <p className="mt-2 text-sm text-site-muted">{when}</p> : null}
              <p className="mt-4 text-sm leading-relaxed text-site-muted">
                {event?.blurb?.trim() ||
                  `${brand} is testing its app with real people before launch, and the session runs over video. Pick a time below and we will email you the link.`}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-site-muted">
                <li>Runs about the length of the session you pick, on your phone or laptop.</li>
                <li>You will talk to the team and try the app while they watch.</li>
                <li>No account, no password. The link in your email is all you need.</li>
              </ul>
            </Card>

            <div className="mt-5">
              <QaSignupForm
                slug={slug}
                slots={slots}
                onDone={(submitted) => {
                  setEmail(submitted);
                  setPhase("done");
                }}
                onReload={loadEvent}
                onClosed={() => setPhase("closed")}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6">{children}</div>;
}

// Type lockup rather than a logo image: no iungo mark has been supplied yet, so
// the collaboration is carried by the wordmarks. Swap in the real lockup here
// (and in QaPopup) when the asset arrives.
function BrandLockup({ brand }: { brand: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
      <span className="text-lg font-semibold tracking-tight">{brand}</span>
      <span className="text-sm text-site-muted">x</span>
      <span className="text-lg font-semibold tracking-tight">Jorsas Tech</span>
    </div>
  );
}
