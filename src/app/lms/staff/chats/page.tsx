"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import ChatLayout from "../../../../components/chat/ChatLayout";
import { STAFF_API } from "../../../../lib/api";
import { getPusher, disconnectPusher } from "../../../../lib/reverb-client";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

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

type MentionableUser = {
  id: number;
  name: string;
  username: string;
  role: "student" | "teacher";
};

type GroupMessage = {
  id: number;
  chat_id?: number;
  content?: string | null;
  sender_role?: "student" | "teacher";
  sender_id?: number | null;
  sender_name?: string;
  attachment_url?: string | null;
  created_at?: string;
  edited_at?: string | null;
};

type DmMessage = {
  id: number;
  content?: string | null;
  body?: string | null;
  from_role?: "student" | "teacher";
  sender_role?: "student" | "teacher";
  sender_id?: number | null;
  sender_name?: string;
  attachment_url?: string | null;
  created_at?: string;
  edited_at?: string | null;
};

type DmThread = {
  thread_id: number;
  student: { id: number; name: string; email?: string | null };
  messages: DmMessage[];
};

export default function StaffChatsPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  const [tab, setTab] = useState<"group" | "dm">("group");

  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupBody, setGroupBody] = useState("");
  const [groupAttachment, setGroupAttachment] = useState("");
  const [groupSending, setGroupSending] = useState(false);

  const [threads, setThreads] = useState<DmThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [dmBody, setDmBody] = useState("");
  const [dmAttachment, setDmAttachment] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [staffProfile, setStaffProfile] = useState<any | null>(null);
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const filteredMentions = mentionQuery !== null
    ? mentionableUsers.filter((u) => !mentionQuery || (u.username?.toLowerCase() ?? "").includes(mentionQuery.toLowerCase()))
    : [];

  const insertMention = (username?: string | null, role?: string | null) => {
    const safeName = username || "user";
    const label = role === "teacher" ? "Tutor" : safeName;
    const cursor = groupInputRef.current?.selectionStart ?? groupBody.length;
    const beforeCursor = groupBody.slice(0, cursor);
    const atMatch = beforeCursor.lastIndexOf("@");
    if (atMatch === -1) return;
    const afterAt = beforeCursor.slice(atMatch + 1);
    const wordEnd = afterAt.search(/\s/);
    const endIdx = wordEnd === -1 ? cursor : atMatch + 1 + wordEnd;
    const newValue = groupBody.slice(0, atMatch) + `@${label} ` + groupBody.slice(endIdx);
    setGroupBody(newValue);
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

  const activeThread = useMemo(
    () => threads.find((t) => t.thread_id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

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

  const loadGroupMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetchStaff(STAFF_API.chatGroupMessages, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setGroupMessages(data);
      // Mark both group and DM as read when entering the chats page
      Promise.all([
        apiFetchStaff(STAFF_API.chatGroupMarkRead, { method: "POST" }),
        apiFetchStaff(STAFF_API.chatDmMarkRead, { method: "POST" }),
      ]).then(() => window.dispatchEvent(new CustomEvent("opencode:chat-read"))).catch(() => {});
    } catch {}
  }, [token]);

  const loadThreads = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetchStaff(STAFF_API.chatDmMessages, { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setThreads(list);
      if (!activeThreadId && list.length > 0) setActiveThreadId(list[0].thread_id);
    } catch {}
  }, [token, activeThreadId]);

  // Initial data load
  useEffect(() => {
    if (!token) return;
    loadGroupMessages();
    loadThreads();
    apiFetchStaff(STAFF_API.profile)
      .then((r) => r.json())
      .then((d) => { if (d) setStaffProfile(d); })
      .catch(() => {});
    apiFetchStaff(STAFF_API.chatGroupMentionable)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMentionableUsers(d); })
      .catch(() => {});
  }, [token, loadGroupMessages, loadThreads]);

  // Subscribe to group chat channels when new chat_ids appear in state
  useEffect(() => {
    if (!token) return;
    const pusher = getPusher(token);

    for (const msg of groupMessages) {
      const cid = msg.chat_id;
      if (cid && !subscribedGroupChats.current.has(cid)) {
        subscribedGroupChats.current.add(cid);
        const channel = pusher.subscribe(`presence-chat.group.${cid}`);
        channel.bind("message.created", (data: GroupMessage) => {
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
        });
      }
    }
  }, [token, groupMessages]);

  const activeThreadIdRef = useRef<number | null>(activeThreadId);
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  // Subscribe to DM channels when new thread_ids appear
  useEffect(() => {
    if (!token) return;
    const pusher = getPusher(token);

    for (const t of threads) {
      if (!subscribedDmThreads.current.has(t.thread_id)) {
        subscribedDmThreads.current.add(t.thread_id);
        const channel = pusher.subscribe(`presence-chat.dm.${t.thread_id}`);
        channel.bind("message.created", (data: DmMessage) => {
          if (!data.id) return;
          setThreads((prev) => prev.map((th) => {
            if (th.thread_id !== t.thread_id) return th;
            if (th.messages.some((m) => m.id === data.id)) return th;
            const tempIdx = th.messages.findIndex((m) => typeof m.id === "string" && (m.id as string).startsWith("temp-") && m.content === data.content);
            if (tempIdx !== -1) {
              const clone = [...th.messages];
              clone[tempIdx] = data;
              return { ...th, messages: clone };
            }
            const isCurrent = activeThreadIdRef.current === t.thread_id;
            const msgObj = { ...data, read: isCurrent };
            return { ...th, messages: [...th.messages, msgObj] };
          }));
          setTimeout(scrollToBottom, 50);
        });
      }
    }
  }, [token, threads]);

  // close menu on outside click
  useEffect(() => {
    if (!menuMsgId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuMsgId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuMsgId]);

  // edit / delete handlers
  const startEdit = (msg: GroupMessage) => {
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
    if (!editingMsgId) return;
    try {
      const res = await apiFetchStaff(STAFF_API.editGroupMessage(editingMsgId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent, attachment_url: editingAttachment || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroupMessages((prev) => prev.map((m) => m.id === editingMsgId ? { ...m, content: data.content, attachment_url: data.attachment_url, edited_at: data.edited_at } : m));
        cancelEdit();
      }
    } catch {}
  };

  const confirmDelete = async (id: number) => {
    setMenuMsgId(null);
    try {
      const res = await apiFetchStaff(STAFF_API.deleteGroupMessage(id), {
        method: "POST",
      });
      if (res.ok) {
        setGroupMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {}
  };

  useEffect(() => { scrollToBottom(); }, [groupMessages, activeThread]);

  // Mark DM as read when switching threads
  useEffect(() => {
    if (!token || !activeThreadId) return;
    apiFetchStaff(STAFF_API.chatDmMarkRead, { method: "POST" })
      .then(() => window.dispatchEvent(new CustomEvent("opencode:chat-read")))
      .catch(() => {});
  }, [token, activeThreadId]);

  async function sendGroupMessage() {
    if (!groupBody.trim() && !groupAttachment.trim()) return;
    const bodyToSend = groupBody;
    const attachmentToSend = groupAttachment;
    setGroupBody(""); setGroupAttachment("");

    const tempId = `temp-${Date.now()}`;
    const tempMsg: GroupMessage = {
      id: tempId as any,
      content: bodyToSend,
      attachment_url: attachmentToSend || null,
      sender_role: "teacher",
      sender_id: staffProfile?.id ?? 0,
      sender_name: staffProfile?.name ?? "You",
      created_at: new Date().toISOString(),
    };

    setGroupMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await apiFetchStaff(STAFF_API.chatGroupMessages, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: bodyToSend, attachment_url: attachmentToSend || null }),
      });
      if (res.ok) {
        const msg = await res.json();
        setGroupMessages((prev) => prev.map((m) => (m.id as any) === tempId ? msg : m));
      }
    } catch {}
  }

  async function sendDm() {
    if (!activeThreadId || (!dmBody.trim() && !dmAttachment.trim())) return;
    const bodyToSend = dmBody;
    const attachmentToSend = dmAttachment;
    setDmBody(""); setDmAttachment(""); setFeedback("");

    const tempId = `temp-${Date.now()}`;
    const tempMsg: DmMessage = {
      id: tempId as any,
      content: bodyToSend,
      attachment_url: attachmentToSend || null,
      sender_role: "teacher",
      sender_id: staffProfile?.id ?? 0,
      sender_name: staffProfile?.name ?? "You",
      created_at: new Date().toISOString(),
    };

    setThreads((prev) => prev.map((t) => t.thread_id === activeThreadId ? { ...t, messages: [...t.messages, tempMsg] } : t));
    setTimeout(scrollToBottom, 50);

    try {
      const res = await apiFetchStaff(STAFF_API.chatDmMessages, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dm_thread_id: activeThreadId, content: bodyToSend, attachment_url: attachmentToSend || null }),
      });
      const data = await res.json();
      if (!res.ok) { setFeedback(data?.message ?? "Could not send."); return; }
      setThreads((prev) => prev.map((t) => t.thread_id === activeThreadId ? { ...t, messages: t.messages.map((m) => (m.id as any) === tempId ? data : m) } : t));
    } catch {}
  }

  return (
    <section className="flex h-[calc(100vh-7rem)] w-full flex-col">
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
        <button onClick={() => setTab("group")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "group" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
          Group Chat
        </button>
        <button onClick={() => setTab("dm")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "dm" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
          Direct Messages
        </button>
        <button
          onClick={tab === "group" ? loadGroupMessages : loadThreads}
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

      {tab === "group" ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {groupMessages.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">No messages yet. Start the conversation!</p>
            ) : (
              groupMessages.map((msg) => {
                const isOwn = msg.sender_role === "teacher";
                const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
                return (
                  <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    <div className={`flex ${isOwn ? "flex-row" : "flex-row"}`}>
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
                            <p className="text-[11px] font-medium text-white/50 mb-0.5">{msg.sender_name ?? (isOwn ? "You" : "Student")}</p>
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
            {mentionQuery !== null ? (
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
              value={groupBody}
              onChange={(e) => {
                const v = e.target.value;
                setGroupBody(v);
                const cursor = e.target.selectionStart ?? v.length;
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
              }}
              placeholder="Type a message…"
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (mentionQuery !== null && filteredMentions.length > 0) {
                  if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((p) => (p + 1) % filteredMentions.length); return; }
                  if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((p) => (p <= 0 ? filteredMentions.length - 1 : p - 1)); return; }
                  if (e.key === "Enter" && mentionIndex >= 0) { e.preventDefault(); insertMention(filteredMentions[mentionIndex].username || filteredMentions[mentionIndex].name, filteredMentions[mentionIndex].role); return; }
                  if (e.key === "Escape") { setMentionQuery(null); setMentionIndex(-1); return; }
                }
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); }
              }}
            />
            <input value={groupAttachment} onChange={(e) => setGroupAttachment(e.target.value)} placeholder="Attachment URL" className="w-40 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <button onClick={sendGroupMessage} disabled={groupSending || (!groupBody.trim() && !groupAttachment.trim())} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50 hover:bg-white/90 transition">
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 w-full overflow-hidden">
          <ChatLayout
            mode="staff"
            threads={threads}
            activeThread={activeThread}
            activeThreadId={activeThreadId}
            setActiveThreadId={setActiveThreadId}
            messageBody={dmBody}
            setMessageBody={setDmBody}
            messageAttachment={dmAttachment}
            setMessageAttachment={setDmAttachment}
            staffProfile={staffProfile}
            sendReply={sendDm}
            sending={dmSending}
            onRefresh={loadThreads}
            onEditMessage={(msg: any) => {
              const tid = activeThreadId;
              if (!tid) return;
              const newContent = prompt("Edit message:", msg.content ?? msg.body ?? "");
              if (newContent === null) return;
              apiFetchStaff(STAFF_API.editDmMessage(msg.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent, attachment_url: msg.attachment_url || null }),
              }).then((r) => r.ok ? r.json() : null).then((data) => {
                if (!data) return;
                setThreads((prev) => prev.map((t) => t.thread_id === tid ? { ...t, messages: t.messages.map((m) => m.id === msg.id ? { ...m, content: data.content, edited_at: data.edited_at } : m) } : t));
              }).catch(() => {});
            }}
            onDeleteMessage={(id: number) => {
              const tid = activeThreadId;
              if (!tid) return;
              if (!confirm("Delete this message?")) return;
              apiFetchStaff(STAFF_API.deleteDmMessage(id), {
                method: "POST",
              }).then((r) => r.ok ? setThreads((prev) => prev.map((t) => t.thread_id === tid ? { ...t, messages: t.messages.filter((m) => m.id !== id) } : t)) : null).catch(() => {});
            }}
          />
        </div>
      )}
    </section>
  );
}
