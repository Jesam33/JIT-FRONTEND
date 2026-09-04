"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STAFF_API, STUDENT_API } from "../../lib/api";
import { ReactionChips, MessageToolbar, ReplyQuote, ReplyingBanner } from "./chat-extras";

type AnyObj = Record<string, any>;

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

function ChatBubble({ message, role, isMe, showAvatar, avatarUrl, senderName, attachmentUrl, editedAt, onEdit, onDelete, onReply, onReact, messageObj }: {
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
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  messageObj?: AnyObj;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

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

  function openMenu() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Open above the button
      setMenuPos({ top: rect.top + window.scrollY - 4, left: rect.left + window.scrollX });
    }
    setMenuOpen((v) => !v);
  }

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
      ) : isMe && (onEdit || onDelete) ? (
        <div className="w-7 shrink-0" />
      ) : null}
      <div className={`flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`w-full break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed border ${
            isMe
              ? "rounded-br-md border-site-primary bg-site-primary text-white"
              : "rounded-bl-md border-site-border bg-site-surface-soft text-site-text"
          }`}
        >
          {messageObj?.reply_to ? <ReplyQuote tone="surface" reply={messageObj.reply_to} placement={isMe ? "own" : "other"} /> : null}
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
        {onReply || onReact || (messageObj?.reactions && messageObj.reactions.length > 0) ? (
          <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            {onReply && onReact ? <MessageToolbar tone="surface" onReply={onReply} onReact={onReact} /> : null}
            {onReact ? <ReactionChips tone="surface" reactions={messageObj?.reactions} onToggle={onReact} align={isMe ? "end" : "start"} /> : null}
          </div>
        ) : null}
      </div>
      {isMe && (onEdit || onDelete) ? (
        <div className="self-center">
          <button
            ref={btnRef}
            type="button"
            onClick={openMenu}
            className="flex h-7 w-7 items-center justify-center rounded-full text-site-muted transition hover:bg-site-surface hover:text-site-text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuPortal}
        </div>
      ) : null}
    </div>
  );
}

function MessageArea({ messages, showAvatarFn, getAvatarUrl, getSenderNameFn, onEditMessage, onDeleteMessage, onReplyMessage, onReactMessage, myRole }: {
  messages: AnyObj[];
  showAvatarFn: (item: AnyObj, idx: number, arr: AnyObj[]) => boolean;
  getAvatarUrl: (item: AnyObj) => string | null;
  getSenderNameFn: (item: AnyObj) => string;
  onEditMessage?: (msg: AnyObj) => void;
  onDeleteMessage?: (id: number) => void;
  onReplyMessage?: (msg: AnyObj) => void;
  onReactMessage?: (msg: AnyObj, emoji: string) => void;
  myRole?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom(containerRef.current);
  }, [messages]);

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

              return (
                  <div key={item.id ? `msg-${item.id}-${idx}` : `msg-idx-${idx}`} className="mb-2">
                    <ChatBubble
                      message={text}
                      role={role}
                      isMe={role === (myRole ?? "student")}
                      showAvatar={showAvatar}
                      avatarUrl={avatarUrl}
                      senderName={name}
                      attachmentUrl={item.attachment_url}
                      editedAt={item.edited_at}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onReply={onReplyMessage ? () => onReplyMessage(item) : undefined}
                      onReact={onReactMessage ? (emoji) => onReactMessage(item, emoji) : undefined}
                      messageObj={item}
                    />
                {time ? (
                  <p className={`mt-0.5 text-[10px] text-site-muted ${role === "teacher" ? "text-right" : "ml-9"}`}>
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
  replyingTo?: { id: number; name: string; content: string } | null;
  onCancelReply?: () => void;
}) {
  const [showAttach, setShowAttach] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = mentionQuery !== null
    ? (mentionableUsers ?? []).filter((u) => !mentionQuery || (u.username?.toLowerCase() ?? "").includes(mentionQuery.toLowerCase()))
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  return (
    <div className="relative space-y-2">
      {replyingTo && onCancelReply ? (
        <ReplyingBanner tone="surface" name={replyingTo.name} content={replyingTo.content} onCancel={onCancelReply} />
      ) : null}
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
                  <span className="text-[10px] text-site-muted">{u.role === "teacher" ? "@Tutor" : `@${u.username}`}</span>
                </div>
                <span className="ml-auto text-[10px] text-site-muted">{u.role === "teacher" ? "tutor" : "student"}</span>
              </button>
            ))
          )}
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
      ? `#track${chatBootstrap?.track?.name ? `: ${chatBootstrap.track.name}` : ""}`
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
            myRole="student"
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
            />
          </div>
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
    onReplyMessage,
    onReactMessage,
    replyingTo,
    onCancelReply,
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
