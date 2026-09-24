"use client";

// "Help & privacy" — the profile tab where an account holder talks to the
// PLATFORM rather than to their academy.
//
// Two things live here, and they are two halves of one story. A student who has
// paid cannot have their account deleted by their academy or by themselves (a
// successful payment is a financial record — see LmsStudent::purgeBlockedReason
// on the backend). The Delete card on this same page therefore points here, at
// the erasure option below, rather than leaving them at a dead end. That is why
// the two cards sit together instead of in two tabs.
//
// The report card is students-only: a report is a student complaining about the
// academy they are enrolled in, and the backend takes that academy from the
// session rather than the request, so offering it to staff would be offering
// something the API refuses.

import { useState } from "react";

/**
 * Mirrors App\Models\AcademyReport::CATEGORIES on the backend, which validates
 * against the same keys. Kept in step by hand: the label text is a product
 * decision that reads better next to this form than in a JSON payload.
 */
const REPORT_CATEGORIES: { value: string; label: string }[] = [
  { value: "payment", label: "I paid but cannot access the course" },
  { value: "access", label: "I cannot get into my account or my course" },
  { value: "quality", label: "The course is not what was described" },
  { value: "conduct", label: "A staff member behaved inappropriately" },
  { value: "other", label: "Something else" },
];

/** Mirrors App\Models\RightsRequest::TYPES. */
const RIGHTS_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "access", label: "A copy of the data you hold about me", hint: "We will send you what we hold." },
  { value: "rectification", label: "Correct something that is wrong", hint: "Tell us what is wrong and what it should say." },
  { value: "erasure", label: "Delete my personal data", hint: "Records of payments and enrolments may be kept where the law requires it." },
  { value: "portability", label: "Move my data somewhere else", hint: "We will send it to you in a portable format." },
  { value: "restrict", label: "Stop using my data for something", hint: "Tell us which use you want stopped." },
  { value: "object", label: "Object to how my data is used", hint: "Tell us what you object to." },
];

const MIN_DETAILS = 20;

type Props = {
  /** The student/staff apiFetch, or the owner's token-carrying fetcher. */
  fetcher: (url: string, options?: RequestInit) => Promise<Response>;
  /** POST target for a data-rights request. */
  rightsEndpoint: string;
  /**
   * POST target for reporting an academy. Omitted for staff and owners, who
   * have no academy of their own to report and whose API call would be refused.
   */
  reportEndpoint?: string;
  /** "account" copy for a student/staff; "academy" wording for an owner. */
  audience?: "person" | "owner";
};

export default function HelpAndPrivacy({ fetcher, rightsEndpoint, reportEndpoint, audience = "person" }: Props) {
  return (
    <div className="space-y-6">
      {reportEndpoint ? <ReportAcademyCard fetcher={fetcher} endpoint={reportEndpoint} /> : null}
      <RightsRequestCard fetcher={fetcher} endpoint={rightsEndpoint} audience={audience} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ReportAcademyCard({ fetcher, endpoint }: { fetcher: Props["fetcher"]; endpoint: string }) {
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [alreadyReported, setAlreadyReported] = useState(false);

  const longEnough = details.trim().length >= MIN_DETAILS;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetcher(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, details: details.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 422 + already_reported is not a failure the person should read as one:
        // they filed this already and Jorsas has it. Say so, and stop offering
        // the form a second time.
        if (data?.already_reported) {
          setAlreadyReported(true);
          setSent(data.message ?? "You have already reported this academy.");
          return;
        }
        setError(data?.message ?? "That did not send. Please try again.");
        return;
      }

      setSent(data?.message ?? "Your report has been sent to Jorsas Tech.");
    } catch {
      setError("That did not send. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Report your academy</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        If your academy has taken money and not delivered, is not what it described, or a staff member
        has behaved badly, tell Jorsas Tech. Your academy does not see this: it goes straight to the
        platform, and someone replies to you by email.
      </p>

      {sent ? (
        <div className="mt-4 rounded-lg border border-green-500/25 bg-green-500/[0.06] p-4">
          <p className="text-sm leading-relaxed text-green-300">{sent}</p>
          {alreadyReported ? (
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              You can add anything you left out by replying to the email Jorsas sent you.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">What is this about?</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="">Choose one</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/50">What happened?</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="As much detail as you can: dates, amounts, who you spoke to, and what you were told."
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
            />
            <p className={`mt-1 text-xs ${longEnough ? "text-white/40" : "text-white/50"}`}>
              {longEnough
                ? "Jorsas Tech will reply to the email address on your account."
                : `At least ${MIN_DETAILS} characters, please — a report we cannot act on wastes your time.`}
            </p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <p className="text-xs leading-relaxed text-white/40">
            One report at a time, so please put everything into this one. If you need to add more
            afterwards, reply to the email you get back.
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={busy || !category || !longEnough}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            {busy ? "Sending..." : "Send report"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function RightsRequestCard({
  fetcher,
  endpoint,
  audience,
}: {
  fetcher: Props["fetcher"];
  endpoint: string;
  audience: "person" | "owner";
}) {
  const [type, setType] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const longEnough = details.trim().length >= MIN_DETAILS;
  const chosen = RIGHTS_TYPES.find((t) => t.value === type);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetcher(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, details: details.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? "That did not send. Please try again.");
        return;
      }
      setSent(data?.message ?? "Your request has been sent to Jorsas Tech.");
    } catch {
      setError("That did not send. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">Your data rights</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        {audience === "owner"
          ? "Ask Jorsas Tech for a copy of what they hold about your academy, to have something corrected or removed, or to object to how it is used. Answering these is Jorsas' job, not your academy's."
          : "Ask Jorsas Tech for a copy of what they hold about you, to have something corrected or removed, or to object to how it is used. This goes to the platform, not to your academy."}
      </p>

      {sent ? (
        <div className="mt-4 rounded-lg border border-green-500/25 bg-green-500/[0.06] p-4">
          <p className="text-sm leading-relaxed text-green-300">{sent}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">What are you asking for?</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="">Choose one</option>
              {RIGHTS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {chosen?.hint ? <p className="mt-1 text-xs text-white/40">{chosen.hint}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/50">Anything we should know?</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Which data, which use, or what needs correcting."
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-white/40">
              {longEnough
                ? "Jorsas Tech will reply to the email address on your account."
                : `At least ${MIN_DETAILS} characters, please.`}
            </p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={busy || !type || !longEnough}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            {busy ? "Sending..." : "Send request"}
          </button>
        </div>
      )}
    </div>
  );
}
