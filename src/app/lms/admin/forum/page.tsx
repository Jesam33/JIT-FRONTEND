"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";

type Forum = {
  id: number;
  title: string;
  topic: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  host_name: string | null;
  status: string;
  cover_image: string | null;
  recording_url: string | null;
  joinable: boolean;
};

type ForumFeed = {
  now: string;
  upcoming: Forum[];
  past: Forum[];
};

type ForumTokenPayload = {
  room?: string;
  jwt?: string;
  domain?: string;
  app_id?: string;
  user_name?: string;
  moderator?: boolean;
  message?: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Time to be announced";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Time to be announced";
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Countdown pieces from now until the target. Returns null once the target passes.
function countdownParts(targetIso: string | null, nowMs: number): { d: number; h: number; m: number; s: number } | null {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - nowMs;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / (1000 * 60)) % 60;
  const h = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { d, h, m, s };
}

export default function OwnerForumPage() {
  const router = useRouter();
  const [feed, setFeed] = useState<ForumFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinMessage, setJoinMessage] = useState<string>("");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(OWNER_API.forums, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load the forum (HTTP ${res.status}).`);
        return;
      }
      const json = (await res.json()) as ForumFeed;
      setFeed(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    load();
  }, [load, router]);

  // Local clock for the countdown + the join-window flip. One second is plenty.
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Re-fetch the feed roughly once a minute so status/joinable stays fresh while
  // the owner sits on the page waiting for a session to open.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!document.hidden && !isLive) load();
    }, 60000);
    return () => window.clearInterval(t);
  }, [load, isLive]);

  const handleMeetingMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const { type, detail } = event.data || {};
    switch (type) {
      case "jitsi-joined":
        setIsLive(true);
        setJoinMessage("You are now in the forum.");
        break;
      case "jitsi-error":
        setIsLive(false);
        setJoinMessage(detail || "Failed to join the forum.");
        break;
      case "jitsi-left":
        setIsLive(false);
        setIframeUrl(null);
        setJoinMessage("You left the forum.");
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMeetingMessage);
    return () => window.removeEventListener("message", handleMeetingMessage);
  }, [handleMeetingMessage]);

  // Esc leaves fullscreen (matches the classroom embed).
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  async function joinForum(forum: Forum) {
    setJoinMessage("");
    setJoiningId(forum.id);
    try {
      const res = await fetch(OWNER_API.forumToken(forum.id), {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json" },
      });
      const payload = (await res.json()) as ForumTokenPayload;
      if (res.status === 401 || res.status === 403) {
        // 403 here is the join-window gate, not an auth failure, so surface the
        // message rather than bouncing to login.
        setJoinMessage(payload.message ?? "The forum room is not open yet.");
        return;
      }
      if (!res.ok || !payload.jwt || !payload.room || !payload.domain || !payload.app_id) {
        setJoinMessage(payload.message ?? "Could not start the forum session.");
        return;
      }
      const url = new URL("/jitsi-meeting.html", window.location.origin);
      url.searchParams.set("domain", payload.domain);
      url.searchParams.set("appId", payload.app_id);
      url.searchParams.set("room", payload.room);
      url.searchParams.set("jwt", payload.jwt);
      url.searchParams.set("userName", payload.user_name ?? "Owner");
      setIframeUrl(url.toString());
    } catch {
      setJoinMessage("Failed to start the forum session. Please try again.");
    } finally {
      setJoiningId(null);
    }
  }

  function leaveForum() {
    setIsLive(false);
    setIframeUrl(null);
    setIsFullscreen(false);
    setJoinMessage("You left the forum.");
  }

  const next = feed?.upcoming?.[0] ?? null;
  const rest = feed?.upcoming?.slice(1) ?? [];
  const past = feed?.past ?? [];
  const counter = next ? countdownParts(next.scheduled_at, nowMs) : null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">CEO&apos;s Forum</h1>
        <p className="mt-1 text-sm text-white/60">
          Live sessions hosted by Jorsas Tech for academy owners. Join from here and re-watch past sessions.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
      ) : null}

      {joinMessage ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{joinMessage}</p>
      ) : null}

      {/* NEXT-FORUM HERO */}
      {next ? (
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03]">
          {next.cover_image ? (
            <div className="h-48 w-full overflow-hidden border-b border-white/10 sm:h-56">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={next.cover_image} alt={next.title} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                {next.status === "live" ? "Live now" : "Upcoming"}
              </span>
              {next.host_name ? <span className="text-xs text-white/50">Host: {next.host_name}</span> : null}
            </div>

            <h2 className="mt-3 text-xl font-semibold text-white">{next.title}</h2>
            {next.topic ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{next.topic}</p> : null}

            <p className="mt-3 text-sm text-white/75">{formatWhen(next.scheduled_at)}</p>
            <p className="text-xs text-white/45">{next.duration_minutes} minutes</p>

            {/* Countdown */}
            {counter ? (
              <div className="mt-4 flex gap-3">
                {[
                  { v: counter.d, l: "days" },
                  { v: counter.h, l: "hrs" },
                  { v: counter.m, l: "min" },
                  { v: counter.s, l: "sec" },
                ].map((p) => (
                  <div key={p.l} className="min-w-[58px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center">
                    <div className="text-lg font-bold tabular-nums text-white">{String(p.v).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-wide text-white/45">{p.l}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Join control */}
            {!isLive ? (
              <div className="mt-5">
                {next.joinable ? (
                  <button
                    type="button"
                    onClick={() => joinForum(next)}
                    disabled={joiningId === next.id}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {joiningId === next.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Joining...
                      </span>
                    ) : (
                      "Join the forum"
                    )}
                  </button>
                ) : (
                  <>
                    <button type="button" disabled className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black opacity-40">
                      Join the forum
                    </button>
                    <p className="mt-2 text-xs text-white/50">The join button opens 10 minutes before the start time.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-emerald-300">Live now. You are in the forum.</p>
                <button
                  type="button"
                  onClick={leaveForum}
                  className="mt-3 rounded-full border border-rose-300/40 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-100"
                >
                  Leave the forum
                </button>
              </div>
            )}

            {/* Embedded room */}
            {iframeUrl ? (
              <div
                className={
                  isFullscreen
                    ? "fixed inset-0 z-[9999] h-screen w-screen bg-black"
                    : "relative mt-5 w-full overflow-hidden rounded-lg border border-white/15"
                }
                style={!isFullscreen ? { height: "72vh", minHeight: "600px" } : undefined}
              >
                <button
                  type="button"
                  onClick={() => setIsFullscreen((f) => !f)}
                  title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                  className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                >
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </button>
                <iframe
                  src={iframeUrl}
                  title={next.title}
                  className="h-full w-full"
                  allow="camera; microphone; display-capture; autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-10 text-center">
          <p className="text-sm text-white/70">No forum scheduled yet.</p>
          <p className="mt-1 text-xs text-white/45">We will email you when the next one is set.</p>
        </section>
      )}

      {/* MORE UPCOMING */}
      {rest.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Also scheduled</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {rest.map((f) => (
              <article key={f.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-xs text-white/55">{formatWhen(f.scheduled_at)}</p>
                {f.topic ? <p className="mt-2 line-clamp-2 text-xs text-white/60">{f.topic}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* PAST ARCHIVE */}
      {past.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Past sessions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((f) => (
              <article key={f.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                {f.cover_image ? (
                  <div className="h-32 w-full overflow-hidden border-b border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.cover_image} alt={f.title} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="p-4">
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-xs text-white/45">{formatShortDate(f.scheduled_at)}</p>
                  {f.recording_url ? (
                    <a
                      href={f.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Watch recording
                    </a>
                  ) : (
                    <p className="mt-3 text-xs text-white/40">Recording coming soon.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
