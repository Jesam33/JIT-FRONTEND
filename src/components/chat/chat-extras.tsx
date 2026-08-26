"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { REACTION_EMOJIS } from "../../lib/chat-reactions";
import type { ChatReaction, ChatReplyPreview } from "../../lib/lms-types";

// Small presentational building blocks shared by all three chat surfaces
// (student chats, staff group chat, staff DM via ChatLayout). The backend
// contract + state helpers live in ../../lib/chat-reactions.ts; this file is
// pure UI. `tone` keeps each surface on its own palette:
//   - "glass"   → the dark-glass white/opacity look (student + staff group)
//   - "surface" → the themeable site-* tokens (ChatLayout / staff DM)
export type ChatTone = "glass" | "surface";

function chipClass(tone: ChatTone, mine: boolean) {
  if (tone === "surface") {
    return mine
      ? "border-site-primary bg-site-primary/15 text-site-primary"
      : "border-site-border bg-site-surface text-site-text hover:bg-site-surface-soft";
  }
  return mine
    ? "border-site-primary/60 bg-site-primary/25 text-white [html.light_&]:text-site-primary"
    : "border-white/15 bg-white/10 text-white/80 hover:bg-white/15 [html.light_&]:border-neutral-300 [html.light_&]:bg-neutral-100 [html.light_&]:text-neutral-700";
}

function iconBtnClass(tone: ChatTone) {
  return tone === "surface"
    ? "text-site-muted hover:bg-site-surface-soft hover:text-site-text"
    : "text-white/40 hover:bg-white/10 hover:text-white [html.light_&]:text-neutral-400 [html.light_&]:hover:bg-neutral-200 [html.light_&]:hover:text-neutral-700";
}

function popoverClass(tone: ChatTone) {
  return tone === "surface"
    ? "border-site-border bg-site-surface shadow-2xl"
    : "border-white/15 bg-black/90 shadow-xl [html.light_&]:border-neutral-300 [html.light_&]:bg-white [html.light_&]:shadow-lg";
}

function emojiHoverClass(tone: ChatTone) {
  return tone === "surface"
    ? "hover:bg-site-surface-soft"
    : "hover:bg-white/10 [html.light_&]:hover:bg-neutral-200";
}

// Quote styling depends on where it sits: on a coloured/own bubble (white text)
// vs a neutral "other" bubble, and on the page background (the compose banner).
function quoteClass(tone: ChatTone, placement: "own" | "other" | "banner") {
  if (placement === "own") return "border-white/50 bg-black/15 text-white/85";
  if (tone === "surface") {
    return placement === "banner"
      ? "border-site-primary/50 bg-site-surface-soft text-site-muted"
      : "border-site-primary/50 bg-site-surface text-site-muted";
  }
  return "border-white/30 bg-white/10 text-white/70 [html.light_&]:border-neutral-300 [html.light_&]:bg-neutral-100 [html.light_&]:text-neutral-500";
}

function replyName(reply: ChatReplyPreview) {
  return reply.sender_name || (reply.sender_role === "teacher" ? "Instructor" : "Student");
}

// The row of existing reactions under a message. Renders nothing when empty.
export function ReactionChips({
  tone,
  reactions,
  onToggle,
  align = "start",
}: {
  tone: ChatTone;
  reactions?: ChatReaction[] | null;
  onToggle: (emoji: string) => void;
  align?: "start" | "end";
}) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${align === "end" ? "justify-end" : "justify-start"}`}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-none transition ${chipClass(tone, !!r.mine)}`}
          title={r.mine ? "Remove your reaction" : "React"}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}
    </div>
  );
}

// Reply + react affordances shown for every message. The react button opens a
// small emoji palette, portalled to <body> so the message scroll container
// never clips it.
export function MessageToolbar({
  tone,
  onReply,
  onReact,
}: {
  tone: ChatTone;
  onReply: () => void;
  onReact: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.top + window.scrollY - 6, left: rect.left + window.scrollX });
    }
    setOpen((v) => !v);
  }

  const picker = open && pos && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateY(-100%)", zIndex: 9999 }}
          className={`flex items-center gap-0.5 rounded-full border p-1 ${popoverClass(tone)}`}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { setOpen(false); onReact(emoji); }}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition hover:scale-110 ${emojiHoverClass(tone)}`}
            >
              {emoji}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  const btn = `flex h-6 w-6 items-center justify-center rounded-full transition ${iconBtnClass(tone)}`;

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={onReply} className={btn} title="Reply" aria-label="Reply">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 17 4 12 9 7" />
          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
      </button>
      <button ref={btnRef} type="button" onClick={toggle} className={btn} title="React" aria-label="Add reaction">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>
      {picker}
    </div>
  );
}

// The small quoted preview shown at the top of a bubble that replies to another
// message. `placement` picks the palette (own coloured bubble vs other bubble).
export function ReplyQuote({
  tone,
  reply,
  placement,
}: {
  tone: ChatTone;
  reply: ChatReplyPreview;
  placement: "own" | "other";
}) {
  return (
    <div className={`mb-1 rounded-r border-l-2 py-0.5 pl-2 text-xs ${quoteClass(tone, placement)}`}>
      <span className="block font-semibold leading-tight opacity-90">{replyName(reply)}</span>
      <span className="block max-w-[220px] truncate leading-tight opacity-80">{reply.content || "Attachment"}</span>
    </div>
  );
}

// The "Replying to …" bar shown above the composer while a reply is staged.
export function ReplyingBanner({
  tone,
  name,
  content,
  onCancel,
}: {
  tone: ChatTone;
  name?: string | null;
  content?: string | null;
  onCancel: () => void;
}) {
  return (
    <div className={`mb-2 flex items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-xs ${quoteClass(tone, "banner")}`}>
      <div className="min-w-0 flex-1">
        <span className="block font-semibold opacity-90">Replying to {name || "message"}</span>
        <span className="block truncate opacity-70">{content || "Attachment"}</span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${iconBtnClass(tone)}`}
        aria-label="Cancel reply"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
