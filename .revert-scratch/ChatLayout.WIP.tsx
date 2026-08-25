"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STAFF_API, STUDENT_API } from "../../lib/api";

type AnyObj = Record<string, any>;

// The fixed reaction palette — kept in lock-step with allowedReactionEmojis()
// on the backend (BaseLmsController) so the UI only offers what the API accepts.
export const REACTIONS = ["👍", "❤️", "😂", "🎉", "👏", "😮"];

function renderMentions(text: string, mentionClass = "font-bold text-site-primary") {
  const parts = text.split(/@(\w+)/);
  if (parts.length === 1) return text;
  const result: (string | React.ReactNode)[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) result.push(parts[i]);
    } else {
      result.push(<span key={i} className={mentionClass}>@{parts[i]}</span>);
    }
  }
  return result;
}

function initialsFromName(name?: string | null) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(value?: string | null) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

function formatDateLabel(value?: string | null) {
  if (!value) return "";
  try {
    const d = new Date(value);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return value;
  }
}

function getSenderName(item: AnyObj) {
  return item.sender_name ?? item.student_name ?? item.name ?? "";
}

function getPhotoUrl(item: AnyObj) {
  return item.profile_photo_url ?? item.sender_profile_photo_url ?? item.student?.profile_photo_url ?? null;
}

function roleLabel(role: string) {
  return role === "teacher" ? "teacher" : role === "student" ? "student" : "student";
}

// Short label for the person a quoted/replied message came from, used when the
// payload doesn't carry a sender_name (e.g. DM messages).
function replyPreviewName(preview: AnyObj) {
  return preview?.sender_name ?? preview?.name
    ?? (preview?.sender_role === "teacher" ? "Instructor" : "Student");
}

function buildDateGroups(messages: AnyObj[]) {
  const groups: { date: string; label: string; items: AnyObj[] }[] = [];
  let current: { date: string; label: string; items: AnyObj[] } | null = null;
  for (const m of messages) {
    const raw = m.created_at ?? m.createdAt ?? null;
    if (!raw) {
      if (!current) {
        current = { date: "", label: "", items: [] };
        groups.push(current);
      }
      current.items.push(m);
      continue;
    }
    const d = new Date(raw);
    const dateKey = d.toDateString();
    if (!current || current.date !== dateKey) {
      current = { date: dateKey, label: formatDateLabel(raw), items: [] };
      groups.push(current);
    }
    current.items.push(m);
  }
  return groups;
}

function scrollToBottom(container: HTMLDivElement | null) {
  if (!container) return;
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function ChatBubble({ message, role, isMe, showAvatar, avatarUrl, senderName, attachmentUrl, editedAt, onEdit, onDelete, onReply, onReact, onJumpTo, messageObj }: {
  message: string;
  role: string;
  isMe: boolean;
  showAvatar: boolean;
  avatarUrl: string | null;
  senderName: string;
  attachmentUrl?: string | null;
  editedAt?: string | null;
  onEdit?: (msg: AnyObj) => void;
  onDelete?: (id: number) => void;
  onReply?: (msg: AnyObj) => void;
  onReact?: (id: number, emoji: string) => void;
  onJumpTo?: (id: number) => void;
  messageObj?: AnyObj;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const [reactOpen, setReactOpen] = useState(false);
  const reactRef = useRef<HTMLDivElement>(null);
  const reactBtnRef = useRef<HTMLButtonElement>(null);
  const [reactPos, setReactPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!reactOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        reactRef.current && !reactRef.current.contains(e.target as Node) &&
        reactBtnRef.current && !reactBtnRef.current.contains(e.target as Node)
      ) setReactOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [reactOpen]);

  function openMenu() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Open above the button
      setMenuPos({ top: rect.top + window.scrollY - 4, left: rect.left + window.scrollX });
    }
    setMenuOpen((v) => !v);
  }

  function openReact() {
    if (reactBtnRef.current) {
      const rect = reactBtnRef.current.getBoundingClientRect();
      setReactPos({ top: rect.top + window.scrollY - 4, left: rect.left + window.scrollX });
    }
    setReactOpen((v) => !v);
  }

  const replyPreview = messageObj?.reply_to ?? null;
  const reactions: AnyObj[] = Array.isArray(messageObj?.reactions) ? messageObj!.reactions : [];
  const hasControls = Boolean(onReact || onReply || (isMe && (onEdit || onDelete)));

  const menuPortal = menuOpen && menuPos && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, transform: "translateY(-100%)", zIndex: 9999 }}
          className="w-28 rounded-xl border border-site-border bg-site-surface p-1 shadow-2xl [html.light_&]:border-neutral-300 [html.light_&]:bg-white"
        >
          {onEdit && messageObj ? (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onEdit(messageObj); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-site-text hover:bg-site-surface-soft"
            >
              Edit
            </button>
          ) : null}
          {onDelete && messageObj ? (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete(messageObj.id); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-site-surface-soft"
            >
              Delete
            </button>
          ) : null}
        </div>,
        document.body
      )
    : null;

  const reactPortal = reactOpen && reactPos && messageObj && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={reactRef}
          style={{ position: "fixed", top: reactPos.top, left: reactPos.left, transform: "translateY(-100%)", zIndex: 9999 }}
          className="flex gap-0.5 rounded-full border border-site-border bg-site-surface p-1 shadow-2xl [html.light_&]:border-neutral-300 [html.light_&]:bg-white"
        >
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { setReactOpen(false); onReact?.(messageObj.id, emoji); }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-site-surface-soft"
            >
              {emoji}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`group relative flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
      {showAvatar ? (
        avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-site-border bg-site-surface-soft text-[10px] font-semibold text-site-text">
            {initialsFromName(senderName)}
          </div>
        )
      ) : (
        <div className="w-7 shrink-0" />
      )}
      <div className={`flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`w-full break-words rounded-2xl border px-3.5 py-2 text-sm leading-relaxed ${
            isMe
              ? "rounded-br-md border-site-primary bg-site-primary text-white"
              : "rounded-bl-md border-site-border bg-site-surface-soft text-site-text"
          }`}
        >
          {replyPreview ? (
            <button
              type="button"
              onClick={() => onJumpTo?.(replyPreview.id)}
              className={`mb-1.5 flex w-full items-stretch gap-2 rounded-lg px-2 py-1 text-left transition ${
                isMe ? "bg-white/15 hover:bg-white/25" : "bg-site-surface hover:bg-site-surface/70"
              }`}
            >
              <span className={`w-0.5 shrink-0 rounded ${isMe ? "bg-white/70" : "bg-site-primary"}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-[11px] font-semibold ${isMe ? "text-white" : "text-site-primary"}`}>
                  {replyPreviewName(replyPreview)}
                </span>
                <span className={`block truncate text-[11px] ${isMe ? "text-white/70" : "text-site-muted"}`}>
                  {replyPreview.content || "Attachment"}
                </span>
              </span>
            </button>
          ) : null}
          {message ? <p>{renderMentions(message, isMe ? "font-bold text-white" : "font-bold text-site-primary")}</p> : null}
          {editedAt ? <span className="ml-1 text-[10px] italic opacity-60">(edited)</span> : null}
          {attachmentUrl ? (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className={`mt-1 inline-flex items-center gap-1.5 text-xs underline ${isMe ? "text-white/80" : "text-site-muted hover:text-site-text"}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              Attachment
            </a>
          ) : null}
        </div>

        {reactions.length ? (
          <div className={`flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact?.(messageObj!.id, r.emoji)}
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition ${
                  r.mine
                    ? "border-site-primary bg-site-primary/10 text-site-text"
                    : "border-site-border bg-site-surface text-site-muted hover:text-site-text"
                }`}
                title={r.mine ? "Remove your reaction" : "React"}
              >
                <span className="leading-none">{r.emoji}</span>
                <span className="text-[10px] font-semibold leading-none">{r.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {hasControls ? (
        <div className="mb-1 flex items-center gap-0.5 self-end opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
          {onReact && messageObj ? (
            <>
              <button
                ref={reactBtnRef}
                type="button"
                onClick={openReact}
                className="flex h-7 w-7 items-center justify-center rounded-full text-site-muted transition hover:bg-site-surface hover:text-site-text"
                title="React"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
              {reactPortal}
            </>
          ) : null}
          {onReply && messageObj ? (
            <button
              type="button"
              onClick={() => onReply(messageObj)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-site-muted transition hover:bg-site-surface hover:text-site-text"
              title="Reply"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 00-4-4H4" />
              </svg>
            </button>
          ) : null}
          {isMe && (onEdit || onDelete) ? (
            <>
              <button
                ref={btnRef}
                type="button"
                onClick={openMenu}
                className="flex h-7 w-7 items-center justify-center rounded-full text-site-muted transition hover:bg-site-surface hover:text-site-text"
                title="More"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {menuPortal}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MessageArea({ messages, showAvatarFn, getAvatarUrl, getSenderNameFn, onEditMessage, onDeleteMessage, onReplyMessage, onReactMessage, myRole, myId }: {
  messages: AnyObj[];
  showAvatarFn: (item: AnyObj, idx: number, arr: AnyObj[]) => boolean;
  getAvatarUrl: (item: AnyObj) => string | null;
  getSenderNameFn: (item: AnyObj) => string;
  onEditMessage?: (msg: AnyObj) => void;
  onDeleteMessage?: (id: number) => void;
  onReplyMessage?: (msg: AnyObj) => void;
  onReactMessage?: (id: number, emoji: string) => void;
  myRole?: string;
  myId?: number | string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightId, setHighlightId] = useState<string | number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollToBottom(containerRef.current);
  }, [messages]);

  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); }, []);

  // Jump to (and briefly highlight) the message a reply quotes. Scoped to this
  // panel's own scroll container so the right message is found even if another
  // chat surface is mounted elsewhere.
  const jumpTo = (id: number) => {
    const el = containerRef.current?.querySelector(`[data-msg-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 1400);
  };

  const dateGroups = buildDateGroups(messages);

  return (
    <div ref={containerRef} className="flex-1 space-y-1 overflow-y-auto rounded-xl border border-site-border bg-site-surface-soft p-4 scroll-smooth" style={{ maxHeight: "420px", minHeight: "280px" }}>
      {dateGroups.length === 0 ? (
        <p className="py-8 text-center text-sm text-site-muted">No messages yet.</p>
      ) : null}
      {dateGroups.map((group) => (
        <div key={group.date || Math.random().toString()}>
          <div className="sticky top-0 my-3 flex justify-center">
            <span className="rounded-full border border-site-border bg-site-surface px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-site-muted">
              {group.label}
            </span>
          </div>
          {group.items.map((item, idx, arr) => {
            const role = roleLabel(item.sender_role ?? item.from_role ?? "student");
            const text = item.content ?? item.body ?? "";
            const time = formatTime(item.created_at ?? item.createdAt ?? null);
            const showAvatar = showAvatarFn(item, idx, arr);
            const avatarUrl = getAvatarUrl(item);
            const name = getSenderNameFn(item);
            // "Mine" means this exact account sent it. In group chat many members
            // share a role, so match by sender id when we know our own id; fall
            // back to role for DM threads (one teacher + one student per thread).
            const roleMatches = role === (myRole ?? "student");
            const isMe = myId != null && item.sender_id != null
              ? String(item.sender_id) === String(myId) && roleMatches
              : roleMatches;
            const isHighlighted = highlightId != null && String(highlightId) === String(item.id);

              return (
                  <div
                    key={item.id ? `msg-${item.id}-${idx}` : `msg-idx-${idx}`}
                    data-msg-id={item.id}
                    className={`mb-2 rounded-xl transition ${isHighlighted ? "bg-site-primary/5 ring-2 ring-site-primary/50" : ""}`}
                  >
                    <ChatBubble
                      message={text}
                      role={role}
                      isMe={isMe}
                      showAvatar={showAvatar}
                      avatarUrl={avatarUrl}
                      senderName={name}
                      attachmentUrl={item.attachment_url}
                      editedAt={item.edited_at}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onReply={onReplyMessage}
                      onReact={onReactMessage}
                      onJumpTo={jumpTo}
                      messageObj={item}
                    />
                {time ? (
                  <p className={`mt-0.5 text-[10px] text-site-muted ${isMe ? "text-right" : "ml-9"}`}>
                    {time}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ChannelList({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-site-muted">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InputBar({ value, onChange, placeholder, onSend, sending, attachmentValue, onAttachmentChange, mentionableUsers, replyingTo, onCancelReply }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSend: () => void;
  sending: boolean;
  attachmentValue?: string;
  onAttachmentChange?: (v: string) => void;
  mentionableUsers?: { id: number; name: string; username: string; role: string }[];
  replyingTo?: AnyObj | null;
  onCancelReply?: () => void;
}) {
  const [showAttach, setShowAttach] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = mentionQuery !== null
    ? (mentionableUsers ?? []).filter((u) => {
        if (!mentionQuery) return true;
        const q = mentionQuery.toLowerCase();
        return (u.username?.toLowerCase() ?? "").includes(q) || (u.name?.toLowerCase() ?? "").includes(q);
      })
    : [];

  const handleChange = (v: string) => {
    onChange(v);
    const cursor = inputRef.current?.selectionStart ?? v.length;
    const beforeCursor = v.slice(0, cursor);
    const atMatch = beforeCursor.lastIndexOf("@");
    if (atMatch !== -1 && (atMatch === 0 || v[atMatch - 1] === " ")) {
      const afterAt = beforeCursor.slice(atMatch + 1);
      if (!afterAt.includes(" ") || afterAt.match(/^[^\s]+\s$/)) {
        const query = afterAt.includes(" ") ? afterAt.split(" ")[0] : afterAt;
        setMentionQuery(query);
        setMentionIndex(-1);
        return;
      }
    }
    setMentionQuery(null);
    setMentionIndex(-1);
  };

  const insertMention = (username?: string | null, role?: string | null) => {
    const safeName = username || "user";
    const label = role === "teacher" ? "Tutor" : safeName;
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const beforeCursor = value.slice(0, cursor);
    const atMatch = beforeCursor.lastIndexOf("@");
    if (atMatch === -1) return;
    const afterAt = beforeCursor.slice(atMatch + 1);
    const wordEnd = afterAt.search(/\s/);
    const endIdx = wordEnd === -1 ? cursor : atMatch + 1 + wordEnd;
    const newValue = value.slice(0, atMatch) + `@${label} ` + value.slice(endIdx);
    onChange(newValue);
    setMentionQuery(null);
    setMentionIndex(-1);
    setTimeout(() => {
      if (inputRef.current) {
        const pos = atMatch + label.length + 2;
        inputRef.current.setSelectionRange(pos, pos);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Enter" && mentionIndex >= 0) {
        e.preventDefault();
        insertMention(filtered[mentionIndex].username || filtered[mentionIndex].name, filtered[mentionIndex].role);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        setMentionIndex(-1);
        return;
      }
    }
    if (e.key === "Escape" && replyingTo && onCancelReply) {
      onCancelReply();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  return (
    <div className="relative space-y-2">
      {mentionQuery !== null ? (
        <div className="absolute bottom-full left-4 right-4 z-50 mb-2 max-h-40 overflow-y-auto rounded-xl border border-site-border bg-site-surface p-1 shadow-xl [html.light_&]:border-neutral-300 [html.light_&]:bg-white [html.light_&]:shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-site-muted">No users found</p>
          ) : (
            filtered.map((u, i) => (
              <button
                key={`${u.role}-${u.id}`}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(u.username || u.name, u.role); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  i === mentionIndex
                    ? "bg-site-surface-soft text-site-text font-medium"
                    : "text-site-muted hover:bg-site-surface-soft hover:text-site-text"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-site-surface-soft text-[10px] font-semibold text-site-text border border-site-border">
                  {u.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-site-text">{u.name}</span>
                  <span className="text-[10px] text-site-muted">{u.role === "teacher" ? "@Tutor" : `@${u.username || u.name}`}</span>
                </div>
                <span className="ml-auto text-[10px] text-site-muted">{u.role === "teacher" ? "tutor" : "student"}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {replyingTo ? (
        <div className="flex items-center gap-2 rounded-xl border border-site-border bg-site-surface-soft px-3 py-2">
          <span className="w-0.5 self-stretch rounded bg-site-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-site-primary">
              Replying to {replyPreviewName(replyingTo)}
            </p>
            <p className="truncate text-xs text-site-muted">
              {replyingTo.content ?? replyingTo.body ?? "Attachment"}
            </p>
          </div>
          {onCancelReply ? (
            <button
              type="button"
              onClick={onCancelReply}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-site-muted transition hover:bg-site-surface hover:text-site-text"
              title="Cancel reply"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}

      {onAttachmentChange && showAttach ? (
        <div className="flex items-center gap-2 rounded-xl border border-site-border bg-site-surface px-4 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-site-muted">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          <input
            value={attachmentValue ?? ""}
            onChange={(e) => onAttachmentChange(e.target.value)}
            placeholder="Paste attachment URL…"
            className="flex-1 bg-transparent text-sm text-site-text outline-none placeholder:text-site-muted/50"
          />
          {attachmentValue ? (
            <button type="button" onClick={() => onAttachmentChange("")} className="text-xs text-site-muted hover:text-site-text">
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[44px] flex-1 rounded-xl border border-site-border bg-site-surface px-4 py-2.5 text-sm text-site-text outline-none transition focus:border-site-primary/50 placeholder:text-site-muted/50"
        />
        {onAttachmentChange ? (
          <button
            type="button"
            onClick={() => setShowAttach((v) => !v)}
            className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border transition ${
              showAttach
                ? "border-site-primary bg-site-surface-soft text-site-primary"
                : "border-site-border bg-site-surface text-site-muted hover:border-site-border hover:bg-site-surface-soft hover:text-site-text"
            }`}
            title="Attach link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !value.trim()}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-site-primary text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {sending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ChatLayout(props: AnyObj) {
  const mode = props.mode ?? "student";
  const onEditMessage = props.onEditMessage as ((msg: AnyObj) => void) | undefined;
  const onDeleteMessage = props.onDeleteMessage as ((id: number) => void) | undefined;
  const onReplyMessage = props.onReplyMessage as ((msg: AnyObj) => void) | undefined;
  const onReactMessage = props.onReactMessage as ((id: number, emoji: string) => void) | undefined;
  const replyingTo = (props.replyingTo ?? null) as AnyObj | null;
  const onCancelReply = props.onCancelReply as (() => void) | undefined;

  if (mode === "student") {
    const {
      chatTab,
      setChatTab,
      chatBootstrap,
      groupMessages,
      dmMessages,
      chatBody,
      setChatBody,
      chatAttachmentUrl,
      setChatAttachmentUrl,
      sendMessage,
      sending,
      mentionableUsers,
      onRefresh,
      unreadGroup = 0,
      unreadDm = 0,
      profile,
    } = props;

    const messages = chatTab === "track" ? groupMessages : dmMessages;
    const channelName = chatTab === "track"
      ? `#track${chatBootstrap?.track?.name ? ` — ${chatBootstrap.track.name}` : ""}`
      : `@${chatBootstrap?.dm_thread?.instructor_name ?? "Instructor"}`;

    function showAvatar(item: AnyObj, idx: number, arr: AnyObj[]) {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return prev.sender_id !== item.sender_id || (prev.sender_role ?? prev.from_role) !== (item.sender_role ?? item.from_role);
    }

    function getAvatarUrl(item: AnyObj) {
      if (profile && item.sender_id === profile.id) return profile.profile_photo_url ?? null;
      return null;
    }

    function getSenderNameFn(item: AnyObj) {
      return item.sender_name ?? item.student_name ?? item.name ?? (item.sender_role === "teacher" ? "Instructor" : "Student");
    }

    return (
      <div className="flex w-full min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <aside className="shrink-0 lg:w-72">
          <div className="flex h-full flex-col rounded-2xl border border-site-border bg-site-surface p-3">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-site-muted">Channels</p>
            <div className="flex gap-2 lg:flex-col">
              <button
                onClick={() => setChatTab("track")}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition lg:flex-none ${
                  chatTab === "track"
                    ? "border-site-border bg-site-surface-soft"
                    : "border-transparent bg-transparent hover:bg-site-surface-soft group"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${chatTab === "track" ? "text-site-text" : "text-site-muted group-hover:text-site-text"}`}>
                    #track
                  </p>
                  {unreadGroup > 0 && chatTab !== "track" ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-site-primary px-1 text-[10px] font-bold text-white">
                      {unreadGroup > 99 ? "99+" : unreadGroup}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-site-muted">
                  {chatBootstrap?.track?.name ?? "Class group"}
                </p>
              </button>
              <button
                onClick={() => setChatTab("dm")}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition lg:flex-none ${
                  chatTab === "dm"
                    ? "border-site-border bg-site-surface-soft"
                    : "border-transparent bg-transparent hover:bg-site-surface-soft group"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${chatTab === "dm" ? "text-site-text" : "text-site-muted group-hover:text-site-text"}`}>
                    @instructor
                  </p>
                  {unreadDm > 0 && chatTab !== "dm" ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-site-primary px-1 text-[10px] font-bold text-white">
                      {unreadDm > 99 ? "99+" : unreadDm}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-site-muted">
                  {chatBootstrap?.dm_thread?.instructor_name ?? "Direct message"}
                </p>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-site-border bg-site-surface">
          <div className="flex shrink-0 items-center justify-between border-b border-site-border px-5 py-3.5">
            <p className="text-sm font-semibold text-site-text">{channelName}</p>
            {onRefresh ? (
              <button onClick={onRefresh} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-site-muted hover:text-site-text transition" title="Refresh messages">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
                Refresh
              </button>
            ) : null}
          </div>

          <MessageArea
            messages={messages}
            showAvatarFn={showAvatar}
            getAvatarUrl={getAvatarUrl}
            getSenderNameFn={getSenderNameFn}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onReplyMessage={onReplyMessage}
            onReactMessage={onReactMessage}
            myRole="student"
            myId={profile?.id}
          />

          <div className="shrink-0 border-t border-site-border p-4">
            <InputBar
              value={chatBody}
              onChange={setChatBody}
              placeholder="Write a message…"
              onSend={sendMessage}
              sending={sending}
              attachmentValue={chatAttachmentUrl}
              onAttachmentChange={setChatAttachmentUrl}
              mentionableUsers={chatTab === "track" ? mentionableUsers : undefined}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
            />
          </div>
        </div>
      </div>
    );
  }

  if (mode === "group") {
    // Staff group tab: a single full-width panel (the roster lives in the page's
    // own tab bar). Same MessageArea/InputBar as every other surface so reply +
    // reactions + avatars + date separators are identical to student/DM chat.
    const {
      messages = [],
      title,
      myId,
      body,
      setBody,
      attachment,
      setAttachment,
      send,
      sending,
      mentionableUsers,
      onRefresh,
    } = props;

    function showAvatar(item: AnyObj, idx: number, arr: AnyObj[]) {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return prev.sender_id !== item.sender_id || (prev.sender_role ?? prev.from_role) !== (item.sender_role ?? item.from_role);
    }

    function getAvatarUrl() {
      return null;
    }

    function getSenderNameFn(item: AnyObj) {
      return item.sender_name ?? item.student_name ?? item.name ?? (item.sender_role === "teacher" ? "Tutor" : "Student");
    }

    return (
      <div className="flex w-full min-h-0 flex-1 flex-col rounded-2xl border border-site-border bg-site-surface">
        <div className="flex shrink-0 items-center justify-between border-b border-site-border px-5 py-3.5">
          <p className="text-sm font-semibold text-site-text">{title ?? "Group chat"}</p>
          {onRefresh ? (
            <button onClick={onRefresh} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-site-muted hover:text-site-text transition" title="Refresh messages">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          ) : null}
        </div>

        <MessageArea
          messages={messages}
          showAvatarFn={showAvatar}
          getAvatarUrl={getAvatarUrl}
          getSenderNameFn={getSenderNameFn}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onReplyMessage={onReplyMessage}
          onReactMessage={onReactMessage}
          myRole="teacher"
          myId={myId}
        />

        <div className="shrink-0 border-t border-site-border p-4">
          <InputBar
            value={body}
            onChange={setBody}
            placeholder="Type a message…"
            onSend={send}
            sending={sending}
            attachmentValue={attachment}
            onAttachmentChange={setAttachment}
            mentionableUsers={mentionableUsers}
            replyingTo={replyingTo}
            onCancelReply={onCancelReply}
          />
        </div>
      </div>
    );
  }

  // staff mode
  const {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    messageBody,
    setMessageBody,
    messageAttachment,
    setMessageAttachment,
    sendReply,
    sending,
    onRefresh,
  } = props;

  function showAvatar(item: AnyObj, idx: number, arr: AnyObj[]) {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    return prev.sender_id !== item.sender_id || (prev.sender_role ?? prev.from_role) !== (item.sender_role ?? item.from_role);
  }

  function getAvatarUrl(item: AnyObj) {
    return activeThread?.student?.profile_photo_url ?? null;
  }

  function getSenderNameFn(item: AnyObj) {
    return activeThread?.student?.name ?? "Student";
  }

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      <aside className="shrink-0 lg:w-72">
        <div className="flex h-full flex-col rounded-2xl border border-site-border bg-site-surface p-3">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-site-muted">Students</p>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {threads.map((thread: AnyObj) => {
              const tid = thread.thread_id ?? thread.id;
              const last = Array.isArray(thread.messages) && thread.messages.length
                ? thread.messages[thread.messages.length - 1]
                : null;
              const lastText = last ? (last.content ?? last.body ?? "") : "";
              const lastTime = formatTime(last?.created_at ?? last?.createdAt ?? null);
              const isSelected = activeThreadId === tid;
              const unread = isSelected
                ? 0
                : (Array.isArray(thread.messages)
                    ? thread.messages.filter((m: AnyObj) => (m.sender_role ?? m.from_role) === "student" && m.read === false).length
                    : 0);

              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setActiveThreadId(tid)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition group ${
                    activeThreadId === tid
                      ? "border-site-border bg-site-surface-soft"
                      : "border-transparent bg-transparent hover:bg-site-surface-soft"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-site-border bg-site-surface-soft text-sm font-semibold text-site-text">
                    {initialsFromName(thread.student?.name ?? thread.student_name ?? thread.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm font-semibold ${activeThreadId === tid ? "text-site-text" : "text-site-muted group-hover:text-site-text"}`}>
                        {thread.student?.name ?? thread.student_name ?? thread.name}
                      </p>
                      {lastTime ? <span className="shrink-0 text-[10px] text-site-muted">{lastTime}</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs text-site-muted">{lastText || "No messages"}</p>
                      {unread > 0 ? (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-black">
                          {unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
            {threads.length === 0 ? (
              <p className="px-2 text-sm text-site-muted">No DM threads yet.</p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-site-border bg-site-surface">
        {!activeThread ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-site-muted">Select a student to view messages.</p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-site-border px-5 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-site-border bg-site-surface-soft text-xs font-semibold text-site-text">
                {initialsFromName(activeThread.student?.name ?? activeThread.student_name ?? activeThread.name)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-site-text">
                  {activeThread.student?.name ?? activeThread.student_name ?? activeThread.name}
                </p>
                <p className="text-[11px] text-site-muted">
                  {activeThread.student?.email ?? ""}
                </p>
              </div>
              {onRefresh ? (
                <button onClick={onRefresh} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-site-muted hover:text-site-text transition" title="Refresh messages">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                  </svg>
                  Refresh
                </button>
              ) : null}
            </div>

            <MessageArea
              messages={activeThread.messages ?? []}
              showAvatarFn={showAvatar}
              getAvatarUrl={getAvatarUrl}
              getSenderNameFn={getSenderNameFn}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onReplyMessage={onReplyMessage}
              onReactMessage={onReactMessage}
              myRole="teacher"
            />

            <div className="shrink-0 border-t border-site-border p-4">
              <InputBar
                value={messageBody}
                onChange={setMessageBody}
                placeholder="Reply to student…"
                onSend={sendReply}
                sending={sending}
                attachmentValue={messageAttachment}
                onAttachmentChange={setMessageAttachment}
                replyingTo={replyingTo}
                onCancelReply={onCancelReply}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
