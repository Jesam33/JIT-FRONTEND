"use client";

// The owner's Reviews page: every verified-learner review of the academy's
// courses (full student name, course, stars, comment, the proof they learned)
// and one public reply per review. Owners can answer reviews but never edit or
// delete them, which is what makes a Jorsas review trustworthy.
// Backend: OwnerReviewController.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";
import LoadingSpinner from "@/components/LoadingSpinner";
import StarRating from "@/components/ui/StarRating";

type Review = {
  id: number;
  course_id: number;
  course_title: string | null;
  student_name: string;
  rating: number;
  comment: string | null;
  proof: string;
  reply: string | null;
  replied_at: string | null;
  date: string | null;
};

type Payload = {
  summary: { count: number; average: number | null; awaiting_reply: number };
  reviews: Review[];
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

export default function OwnerReviewsPage() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "awaiting">("all");
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(OWNER_API.reviews, { headers: { Accept: "application/json", ...ownerAuthHeaders() } });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!res.ok) {
        setError(`Could not load reviews (HTTP ${res.status}).`);
        return;
      }
      setError("");
      setData(await res.json());
    } catch {
      setError("Could not load reviews. Refresh to try again.");
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    (async () => {
      await load();
    })();
  }, [load, router]);

  const shown = useMemo(() => {
    const all = data?.reviews ?? [];
    return filter === "awaiting" ? all.filter((r) => !r.reply && r.comment) : all;
  }, [data, filter]);

  const saveReply = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch(OWNER_API.reviewReply(editing.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ reply: editing.text }),
      });
      if (res.ok) {
        setEditing(null);
        await load();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.message || "Could not save your reply.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-white/60">
          Every review here is from a verified learner: a student who actually attended your classes, completed work or
          finished the course. You can reply publicly; reviews can&apos;t be edited or removed, which is why visitors trust them.
        </p>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      {data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.04] p-4">
              <p className="truncate text-xs uppercase tracking-wide text-white/50">Average</p>
              <p className="mt-1 text-2xl font-semibold text-white">{data.summary.average != null ? data.summary.average.toFixed(1) : "-"}</p>
              {data.summary.average != null ? <StarRating value={data.summary.average} size="sm" hideValue /> : null}
            </div>
            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.04] p-4">
              <p className="truncate text-xs uppercase tracking-wide text-white/50">Reviews</p>
              <p className="mt-1 text-2xl font-semibold text-white">{data.summary.count}</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.04] p-4">
              <p className="truncate text-xs uppercase tracking-wide text-white/50">Awaiting reply</p>
              <p className="mt-1 text-2xl font-semibold text-white">{data.summary.awaiting_reply}</p>
            </div>
          </div>

          <div className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1 text-sm">
            {(["all", "awaiting"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 font-semibold transition ${filter === f ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
              >
                {f === "all" ? "All" : "Awaiting reply"}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-8 text-center text-sm text-white/65">
              {data.summary.count === 0
                ? "No reviews yet. Students can review a course once they've attended a few classes or finished it."
                : "Nothing waiting for a reply."}
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((r) => (
                <li key={r.id} className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{r.student_name}</p>
                      <p className="truncate text-xs text-white/50">{r.course_title}</p>
                    </div>
                    <div className="text-right">
                      <StarRating value={r.rating} size="sm" hideValue />
                      <p className="mt-0.5 text-[11px] text-white/40">{fmtDate(r.date)}</p>
                    </div>
                  </div>
                  {r.proof ? <p className="mt-2 text-[11px] font-medium text-emerald-300/90">✓ Verified learner · {r.proof}</p> : null}
                  {r.comment ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-white/80">{r.comment}</p>
                  ) : (
                    <p className="mt-2 text-xs italic text-white/40">Stars only, no written review.</p>
                  )}

                  {editing?.id === r.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={editing.text}
                        onChange={(e) => setEditing({ id: r.id, text: e.target.value })}
                        rows={3}
                        maxLength={1000}
                        placeholder="Write a public reply. Thank them, or address their feedback."
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/35"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white">
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={saveReply}
                          className="rounded-lg bg-site-primary px-4 py-1.5 text-xs font-semibold text-[#fff] disabled:opacity-50"
                        >
                          {busy ? "Saving…" : editing.text.trim() ? "Post reply" : "Remove reply"}
                        </button>
                      </div>
                    </div>
                  ) : r.reply ? (
                    <div className="mt-3 rounded-lg border-l-2 border-[color:var(--color-primary)] bg-white/[0.04] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Your reply</p>
                        <button type="button" onClick={() => setEditing({ id: r.id, text: r.reply ?? "" })} className="text-xs text-white/60 hover:text-white">
                          Edit
                        </button>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-white/75">{r.reply}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing({ id: r.id, text: "" })}
                      className="mt-3 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40"
                    >
                      Reply
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
