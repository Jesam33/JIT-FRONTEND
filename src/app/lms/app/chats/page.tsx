"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChatMessage, ChatBootstrap, StudentProfile } from "../../../../lib/lms-types";
import { getToken } from "../../../../lib/lms-utils";
import { apiFetch, okJson } from "../../../../lib/fetch-with-timeout";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../../lib/api";
import { getPusher, disconnectPusher } from "../../../../lib/reverb-client";

function renderMentions(text: string, mentionClass = "font-bold text-site-primary") {
  const parts = text.split(/@(\w+)/);
  if (parts.length === 1) return text;
  const result: (string | ReactNode)[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) result.push(parts[i]);
    } else {
      result.push(<span key={i} className={mentionClass}>@{parts[i]}</span>);
    }
  }
  return result;
}

type MentionableUser = { id: number; name: string; username: string; role: string };

export default function StudentChatsPage() {
  const [chatBootstrap, setChatBootstrap] = useState<ChatBootstrap | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [chatTab, setChatTab] = useState<"track" | "dm">("track");
  const [chatBody, setChatBody] = useState("");
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);
  const [unreadGroup, setUnreadGroup] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);
  const chatTabRef = useRef<"track" | "dm">("track");

  // edit / delete state
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingAttachment, setEditingAttachment] = useState("");
  const [menuMsgId, setMenuMsgId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = useMemo(() => getToken(), []);

  const messages = chatTab === "track" ? groupMessages : dmMessages;

  // Mentions only make sense in the class group (the DM is a 1:1 with the instructor).
  const filteredMentions = mentionQuery !== null && chatTab === "track"
    ? mentionableUsers.filter((u) => !mentionQuery || (u.username?.toLowerCase() ?? "").includes(mentionQuery.toLowerCase()))
    : [];

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const insertMention = (username?: string | null, role?: string | null) => {
    const safeName = username || "user";
    const label = role === "teacher" ? "Tutor" : safeName;
    const cursor = groupInputRef.current?.selectionStart ?? chatBody.length;
    const beforeCursor = chatBody.slice(0, cursor);
    const atMatch = beforeCursor.lastIndexOf("@");
    if (atMatch === -1) return;
    const afterAt = beforeCursor.slice(atMatch + 1);
    const wordEnd = afterAt.search(/\s/);
    const endIdx = wordEnd === -1 ? cursor : atMatch + 1 + wordEnd;
    const newValue = chatBody.slice(0, atMatch) + `@${label} ` + chatBody.slice(endIdx);
    setChatBody(newValue);
    setMentionQuery(null);
    setMentionIndex(-1);
    setTimeout(() => {
      if (groupInputRef.current) {
        const pos = atMatch + label.length + 2;
        groupInputRef.current.setSelectionRange(pos, pos);
        groupInputRef.current.focus();
      }
    }, 0);
  };

  useEffect(() => {
    if (!token) return;

    // Show chat UI immediately (empty state), populate as data arrives. Gate the
    // object-shape reads on r.ok (okJson) so a tenant/auth hiccup never spreads an
    // error body into state — 401s redirect upstream in fetchWithTimeout.
    const bootstrapPromise = apiFetch(STUDENT_API.chatBootstrap)
      .then(okJson).then((p) => setChatBootstrap(p)).catch(() => {});

    apiFetch(STUDENT_API.profile)
      .then(okJson).then((p) => setProfile(p)).catch(() => {});

    apiFetch(STUDENT_API.chatGroupMentionable)
      .then((r) => r.json()).then((p) => setMentionableUsers(Array.isArray(p) ? p : [])).catch(() => {});

    // Unblock UI as soon as bootstrap resolves (success or failure)
    bootstrapPromise.then(() => {
      setLoading(false);
      markReadOnBackend("track");
    }).catch(() => setLoading(false));

    // Load messages in the background
    apiFetch(STUDENT_API.chatGroupMessages)
      .then((r) => r.json()).then((p) => setGroupMessages(Array.isArray(p) ? p : [])).catch(() => {});

    apiFetch(STUDENT_API.chatDmMessages)
      .then((r) => r.json()).then((p) => setDmMessages(Array.isArray(p) ? p : [])).catch(() => {});
  }, [token]);

  const subscribedGroupChats = useRef<Set<number>>(new Set());
  const subscribedDmThreads = useRef<Set<number>>(new Set());

  // Initialize Pusher once on mount
  useEffect(() => {
    if (!token) return;
    getPusher(token);
    return () => {
      subscribedGroupChats.current.clear();
      subscribedDmThreads.current.clear();
      disconnectPusher();
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const pusher = getPusher(token);
    if (!pusher) return;

    const gcId = chatBootstrap?.group_chat?.id;
    if (gcId && !subscribedGroupChats.current.has(gcId)) {
      subscribedGroupChats.current.add(gcId);
      const channel = pusher.subscribe(`presence-chat.group.${gcId}`);
      channel.bind("message.created", (data: ChatMessage) => {
        if (!data.id) return;
        setGroupMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          const tempIdx = prev.findIndex((m) => typeof m.id === "string" && (m.id as string).startsWith("temp-") && m.content === data.content);
          if (tempIdx !== -1) {
            const clone = [...prev];
            clone[tempIdx] = data;
            return clone;
          }
          return [...prev, data];
        });
        // Only count as unread if student is NOT on the track tab
        if (chatTabRef.current !== "track") {
          setUnreadGroup((n) => n + 1);
        }
      });
    }

    const dmId = chatBootstrap?.dm_thread?.id;
    if (dmId && !subscribedDmThreads.current.has(dmId)) {
      subscribedDmThreads.current.add(dmId);
      const channel = pusher.subscribe(`presence-chat.dm.${dmId}`);
      channel.bind("message.created", (data: ChatMessage) => {
        if (!data.id) return;
        setDmMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          const tempIdx = prev.findIndex((m) => typeof m.id === "string" && (m.id as string).startsWith("temp-") && m.content === data.content);
          if (tempIdx !== -1) {
            const clone = [...prev];
            clone[tempIdx] = data;
            return clone;
          }
          return [...prev, data];
        });
        // Only count as unread if student is NOT on the dm tab AND the message is from the teacher
        if (chatTabRef.current !== "dm" && (data.sender_role === "teacher" || data.from_role === "teacher")) {
          setUnreadDm((n) => n + 1);
        }
      });
    }
  }, [token, chatBootstrap]);

  // Keep chatTabRef in sync so WebSocket callbacks can read the latest tab
  useEffect(() => {
    chatTabRef.current = chatTab;
  }, [chatTab]);

  // Auto-scroll to newest message when the list or active tab changes
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Close the message action menu on outside click
  useEffect(() => {
    if (!menuMsgId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuMsgId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuMsgId]);

  function markReadOnBackend(tab: "track" | "dm") {
    if (!token) return;
    const api = tab === "track" ? STUDENT_API.chatGroupMarkRead : STUDENT_API.chatDmMarkRead;
    apiFetch(api, { method: "POST" })
      .then(() => window.dispatchEvent(new CustomEvent("opencode:chat-read")))
      .catch(() => {});
  }

  function switchTab(tab: "track" | "dm") {
    setChatTab(tab);
    setMentionQuery(null);
    setMentionIndex(-1);
    if (tab === "track") setUnreadGroup(0);
    if (tab === "dm") setUnreadDm(0);
    markReadOnBackend(tab);
  }

  // edit / delete handlers (tab-aware: group vs instructor DM)
  const startEdit = (msg: any) => {
    setEditingMsgId(msg.id);
    setEditingContent(msg.content ?? "");
    setEditingAttachment(msg.attachment_url ?? "");
    setMenuMsgId(null);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditingContent("");
    setEditingAttachment("");
  };

  const saveEdit = async () => {
    if (editingMsgId == null) return;
    const isGroup = chatTab === "track";
    const api = isGroup ? STUDENT_API.editGroupMessage(editingMsgId) : STUDENT_API.editDmMessage(editingMsgId);
    try {
      const res = await apiFetch(api, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent, attachment_url: editingAttachment || null }),
      });
      if (res.ok) {
        const data = await res.json();
        const patch = (m: ChatMessage): ChatMessage => (m.id === editingMsgId ? { ...m, content: data.content, attachment_url: data.attachment_url, edited_at: data.edited_at } : m);
        if (isGroup) setGroupMessages((prev) => prev.map(patch));
        else setDmMessages((prev) => prev.map(patch));
        cancelEdit();
      }
    } catch {}
  };

  const confirmDelete = async (id: number) => {
    setMenuMsgId(null);
    const isGroup = chatTab === "track";
    const api = isGroup ? STUDENT_API.deleteGroupMessage(id) : STUDENT_API.deleteDmMessage(id);
    try {
      const res = await apiFetch(api, { method: "POST" });
      if (res.ok) {
        if (isGroup) setGroupMessages((prev) => prev.filter((m) => m.id !== id));
        else setDmMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {}
  };

  async function sendMessage() {
    if (!chatBody.trim() && !chatAttachmentUrl.trim()) return;
    const contentToSend = chatBody;
    const attachmentToSend = chatAttachmentUrl;
    setChatBody("");
    setChatAttachmentUrl("");
    setMentionQuery(null);
    setMentionIndex(-1);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId as any,
      content: contentToSend,
      attachment_url: attachmentToSend || null,
      sender_role: "student",
      sender_id: profile?.id ?? 0,
      sender_name: profile ? `${profile.first_name} ${profile.last_name}` : "You",
      created_at: new Date().toISOString(),
    };

    const isGroup = chatTab === "track";
    if (isGroup) {
      setGroupMessages((prev) => [...prev, tempMsg]);
    } else {
      setDmMessages((prev) => [...prev, tempMsg]);
    }
    setTimeout(scrollToBottom, 50);

    try {
      const endpoint = isGroup ? STUDENT_API.chatGroupMessages : STUDENT_API.chatDmMessages;
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToSend,
          attachment_url: attachmentToSend || null,
        }),
      });

      const payload = await response.json();

      if (response.ok && payload.id) {
        if (isGroup) {
          setGroupMessages((prev) => prev.map((m) => (m.id as any) === tempId ? payload : m));
        } else {
          setDmMessages((prev) => prev.map((m) => (m.id as any) === tempId ? payload : m));
        }
      }
    } catch {}
  }

  async function refreshChats() {
    if (!token) return;
    try {
      await Promise.all([
        apiFetch(STUDENT_API.chatGroupMessages).then(async (r) => { if (r.ok) { const p = await r.json(); setGroupMessages(Array.isArray(p) ? p : []); } }),
        apiFetch(STUDENT_API.chatDmMessages).then(async (r) => { if (r.ok) { const p = await r.json(); setDmMessages(Array.isArray(p) ? p : []); } }),
      ]);
    } catch {}
  }

  function onInputChange(v: string) {
    setChatBody(v);
    // @mention detection only in the class group
    if (chatTab !== "track") { setMentionQuery(null); setMentionIndex(-1); return; }
    const cursor = groupInputRef.current?.selectionStart ?? v.length;
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
  }

  if (loading) return <LoadingSpinner />;

  return (
    <section className="flex h-[calc(100dvh-10rem)] min-h-[420px] w-full flex-col overflow-hidden">
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
        <button
          onClick={() => switchTab("track")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab_active("track", chatTab)}`}
        >
          Class Group
          {unreadGroup > 0 && chatTab !== "track" ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-site-primary px-1 text-[10px] font-bold text-white">
              {unreadGroup > 99 ? "99+" : unreadGroup}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => switchTab("dm")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab_active("dm", chatTab)}`}
        >
          Instructor
          {unreadDm > 0 && chatTab !== "dm" ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-site-primary px-1 text-[10px] font-bold text-white">
              {unreadDm > 99 ? "99+" : unreadDm}
            </span>
          ) : null}
        </button>
        <button
          onClick={refreshChats}
          className="ml-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:text-white transition"
          title="Refresh messages"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-8">
              {chatTab === "track" ? "No messages yet. Start the conversation!" : "No messages with your instructor yet."}
            </p>
          ) : (
            messages.map((raw) => {
              const msg: any = raw;
              const role = msg.sender_role ?? msg.from_role;
              const isOwn = !!profile && msg.sender_id === profile.id && role !== "teacher";
              const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
              const senderLabel = msg.sender_name ?? (isOwn ? "You" : role === "teacher" ? "Instructor" : "Student");
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  <div className="flex flex-row">
                    <div className={`w-full break-words rounded-xl px-3 py-2 ${isOwn ? "bg-white/15 text-white" : "bg-white/5 text-white/90"}`}>
                      {editingMsgId === msg.id ? (
                        <div className="space-y-2">
                          <input value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm" autoFocus />
                          <input value={editingAttachment} onChange={(e) => setEditingAttachment(e.target.value)} placeholder="Attachment URL" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm" />
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-black hover:bg-white/90">Save</button>
                            <button onClick={cancelEdit} className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] font-medium text-white/50 mb-0.5">{senderLabel}</p>
                          {msg.content ? (
                            <p className="text-sm">
                              {renderMentions(msg.content, isOwn ? "font-bold text-white" : "font-bold text-site-primary")}
                              {msg.edited_at ? <span className="ml-1 text-[10px] text-white/30 italic">(edited)</span> : null}
                            </p>
                          ) : null}
                          {msg.attachment_url ? (
                            <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline">View attachment</a>
                          ) : null}
                        </>
                      )}
                    </div>
                    {editingMsgId !== msg.id && isOwn ? (
                      <div className="relative ml-1 self-start">
                        <button onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)} className="mt-1 flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/10 text-white/40 hover:text-white">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                        </button>
                        {menuMsgId === msg.id ? (
                          <div ref={menuRef} className="absolute right-0 top-full z-50 mt-1 w-28 rounded-xl border border-white/15 bg-black/90 p-1 shadow-xl [html.light_&]:border-neutral-300 [html.light_&]:bg-white [html.light_&]:shadow-lg">
                            <button onClick={() => startEdit(msg)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10">Edit</button>
                            <button onClick={() => confirmDelete(msg.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-white/10">Delete</button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <p className={`mt-0.5 text-[10px] text-white/40 ${isOwn ? "text-right" : "text-left"}`}>{timeStr}</p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="relative flex gap-2 border-t border-white/10 p-3">
          {mentionQuery !== null && chatTab === "track" ? (
            <div className="absolute bottom-full left-3 right-3 z-50 mb-2 max-h-40 overflow-y-auto rounded-xl border border-white/15 bg-black/90 p-1 shadow-xl [html.light_&]:border-neutral-300 [html.light_&]:bg-white [html.light_&]:shadow-lg">
              {filteredMentions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-white/50 [html.light_&]:text-neutral-500">No users found</p>
              ) : (
                filteredMentions.map((u, i) => (
                  <button
                    key={`${u.role}-${u.id}`}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); insertMention(u.username || u.name, u.role); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      i === mentionIndex ? "bg-white/15 text-white [html.light_&]:bg-neutral-100 [html.light_&]:text-neutral-900" : "text-white/80 hover:bg-white/10 [html.light_&]:text-neutral-700 [html.light_&]:hover:bg-neutral-100"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold [html.light_&]:bg-neutral-200 [html.light_&]:text-neutral-700">
                      {(u.name || "U").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span>{u.name}</span>
                      <span className="text-[10px] text-white/40 [html.light_&]:text-neutral-400">{u.role === "teacher" ? "@Tutor" : `@${u.username || u.name}`}</span>
                    </div>
                    <span className="ml-auto text-[10px] text-white/40 [html.light_&]:text-neutral-400">{u.role === "teacher" ? "tutor" : "student"}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
          <input
            ref={groupInputRef}
            value={chatBody}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={chatTab === "track" ? "Type a message…" : "Message your instructor…"}
            className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (mentionQuery !== null && chatTab === "track" && filteredMentions.length > 0) {
                if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((p) => (p + 1) % filteredMentions.length); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((p) => (p <= 0 ? filteredMentions.length - 1 : p - 1)); return; }
                if (e.key === "Enter" && mentionIndex >= 0) { e.preventDefault(); insertMention(filteredMentions[mentionIndex].username || filteredMentions[mentionIndex].name, filteredMentions[mentionIndex].role); return; }
                if (e.key === "Escape") { setMentionQuery(null); setMentionIndex(-1); return; }
              }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
          />
          <input value={chatAttachmentUrl} onChange={(e) => setChatAttachmentUrl(e.target.value)} placeholder="Attachment URL" className="w-40 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
          <button onClick={sendMessage} disabled={sending || (!chatBody.trim() && !chatAttachmentUrl.trim())} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50 hover:bg-white/90 transition">
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

function tab_active(tab: "track" | "dm", current: "track" | "dm") {
  return tab === current ? "bg-white/10 text-white" : "text-white/50 hover:text-white";
}
