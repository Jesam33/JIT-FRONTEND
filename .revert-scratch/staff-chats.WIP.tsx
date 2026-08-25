"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import ChatLayout from "../../../../components/chat/ChatLayout";
import { STAFF_API } from "../../../../lib/api";
import { getPusher, disconnectPusher, isPusherConnected } from "../../../../lib/reverb-client";
import { apiFetchStaff, okJson } from "../../../../lib/fetch-with-timeout";
import { toggleReactionLocal, mergeReactionCounts } from "../../../../lib/chat-reactions";
import type { ChatReaction, ChatReplyPreview } from "../../../../lib/lms-types";

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
  reply_to_id?: number | null;
  reply_to?: ChatReplyPreview | null;
  reactions?: ChatReaction[];
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
  reply_to_id?: number | null;
  reply_to?: ChatReplyPreview | null;
  reactions?: ChatReaction[];
  read?: boolean;
  created_at?: string;
  edited_at?: string | null;
};

type DmThread = {
  thread_id: number;
  student: { id: number; name: string; email?: string | null; profile_photo_url?: string | null };
  messages: DmMessage[];
};

// Change-detection helpers for the polling fallback: only replace state when the
// tail actually moved, so idle polls cause no re-render or scroll jump, and never
// clobber an in-flight optimistic ("temp-") send.
function tailId(list: { id: unknown }[]): unknown {
  return list.length ? list[list.length - 1].id : null;
}
function listUnchanged(a: { id: unknown }[], b: { id: unknown }[]): boolean {
  return a.length === b.length && tailId(a) === tailId(b);
}
function hasPendingTemp(list: { id: unknown }[]): boolean {
  return list.some((m) => typeof m.id === "string" && (m.id as string).startsWith("temp-"));
}
function threadsSignature(threads: { thread_id: number; messages: { id: unknown }[] }[]): string {
  return threads.map((t) => `${t.thread_id}:${t.messages.length}:${String(tailId(t.messages))}`).join("|");
}
function threadsHavePendingTemp(threads: { messages: { id: unknown }[] }[]): boolean {
  return threads.some((t) => hasPendingTemp(t.messages));
}

export default function StaffChatsPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  const [tab, setTab] = useState<"group" | "dm">("group");

  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupBody, setGroupBody] = useState("");
  const [groupAttachment, setGroupAttachment] = useState("");
  const [groupSending] = useState(false);

  const [threads, setThreads] = useState<DmThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [dmBody, setDmBody] = useState("");
  const [dmAttachment, setDmAttachment] = useState("");
  const [dmSending] = useState(false);

  const [staffProfile, setStaffProfile] = useState<any | null>(null);
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);

  // Reply target (shared across both tabs; cleared on tab switch so a group
  // reply can't leak into a DM send and vice-versa).
  const [replyingTo, setReplyingTo] = useState<GroupMessage | DmMessage | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.thread_id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

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
      .then(okJson)
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
    if (!pusher) return;

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
        channel.bind("reaction.updated", (data: { message_id: number; reactions: ChatReaction[] }) => {
          if (!data || data.message_id == null) return;
          setGroupMessages((prev) => prev.map((m) => String(m.id) === String(data.message_id)
            ? { ...m, reactions: mergeReactionCounts(m.reactions, data.reactions) }
            : m));
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
    if (!pusher) return;

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
        });
        channel.bind("reaction.updated", (data: { message_id: number; reactions: ChatReaction[] }) => {
          if (!data || data.message_id == null) return;
          setThreads((prev) => prev.map((th) => th.thread_id === t.thread_id
            ? { ...th, messages: th.messages.map((m) => String(m.id) === String(data.message_id)
                ? { ...m, reactions: mergeReactionCounts(m.reactions, data.reactions) }
                : m) }
            : th));
        });
      }
    }
  }, [token, threads]);

  // Fallback delivery: when the live socket isn't connected (Reverb/Pusher not
  // configured, or mid-reconnect) poll so new group + DM messages still appear
  // without a manual refresh. Inert while push is active or the tab is hidden;
  // skips when a send is mid-flight or nothing changed so it never clobbers an
  // optimistic message or forces a scroll jump.
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      if (document.hidden || isPusherConnected()) return;
      try {
        const [g, d] = await Promise.all([
          apiFetchStaff(STAFF_API.chatGroupMessages, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          apiFetchStaff(STAFF_API.chatDmMessages, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (Array.isArray(g)) setGroupMessages((prev) => (hasPendingTemp(prev) || listUnchanged(prev, g) ? prev : g));
        if (Array.isArray(d)) setThreads((prev) => (threadsHavePendingTemp(prev) || threadsSignature(prev) === threadsSignature(d) ? prev : d));
      } catch {}
    };
    const id = window.setInterval(poll, 5000);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  // Mark DM as read when switching threads
  useEffect(() => {
    if (!token || !activeThreadId) return;
    apiFetchStaff(STAFF_API.chatDmMarkRead, { method: "POST" })
      .then(() => window.dispatchEvent(new CustomEvent("opencode:chat-read")))
      .catch(() => {});
  }, [token, activeThreadId]);

  function switchTab(next: "group" | "dm") {
    setTab(next);
    setReplyingTo(null);
  }

  async function sendGroupMessage() {
    if (!groupBody.trim() && !groupAttachment.trim()) return;
    const bodyToSend = groupBody;
    const attachmentToSend = groupAttachment;
    // Only real (numeric) message ids can be threaded; a not-yet-confirmed temp
    // id would fail the backend's integer validation.
    const replyTarget = replyingTo;
    const replyToId = typeof replyTarget?.id === "number" ? replyTarget.id : null;
    setGroupBody(""); setGroupAttachment("");
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: GroupMessage = {
      id: tempId as any,
      content: bodyToSend,
      attachment_url: attachmentToSend || null,
      sender_role: "teacher",
      sender_id: staffProfile?.id ?? 0,
      sender_name: staffProfile?.name ?? "You",
      created_at: new Date().toISOString(),
      reply_to_id: replyToId,
      reply_to: replyToId && replyTarget ? {
        id: replyToId,
        content: replyTarget.content ?? (replyTarget as DmMessage).body ?? null,
        sender_role: replyTarget.sender_role ?? (replyTarget as DmMessage).from_role,
        sender_name: replyTarget.sender_name ?? null,
      } : null,
      reactions: [],
    };

    setGroupMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await apiFetchStaff(STAFF_API.chatGroupMessages, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: bodyToSend, attachment_url: attachmentToSend || null, reply_to_id: replyToId }),
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
    const replyTarget = replyingTo;
    const replyToId = typeof replyTarget?.id === "number" ? replyTarget.id : null;
    setDmBody(""); setDmAttachment("");
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: DmMessage = {
      id: tempId as any,
      content: bodyToSend,
      attachment_url: attachmentToSend || null,
      sender_role: "teacher",
      sender_id: staffProfile?.id ?? 0,
      sender_name: staffProfile?.name ?? "You",
      created_at: new Date().toISOString(),
      reply_to_id: replyToId,
      reply_to: replyToId && replyTarget ? {
        id: replyToId,
        content: replyTarget.content ?? (replyTarget as DmMessage).body ?? null,
        sender_role: replyTarget.sender_role ?? (replyTarget as DmMessage).from_role,
        sender_name: replyTarget.sender_name ?? null,
      } : null,
      reactions: [],
    };

    setThreads((prev) => prev.map((t) => t.thread_id === activeThreadId ? { ...t, messages: [...t.messages, tempMsg] } : t));

    try {
      const res = await apiFetchStaff(STAFF_API.chatDmMessages, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dm_thread_id: activeThreadId, content: bodyToSend, attachment_url: attachmentToSend || null, reply_to_id: replyToId }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setThreads((prev) => prev.map((t) => t.thread_id === activeThreadId ? { ...t, messages: t.messages.map((m) => (m.id as any) === tempId ? data : m) } : t));
    } catch {}
  }

  // Optimistically toggle the viewer's reaction, then POST and reconcile with the
  // authoritative counts the server returns. Other clients pick up the change via
  // the `reaction.updated` broadcast.
  async function reactToGroupMessage(id: number | string, emoji: string) {
    setGroupMessages((prev) => prev.map((m) => String(m.id) === String(id)
      ? { ...m, reactions: toggleReactionLocal(m.reactions, emoji) }
      : m));
    if (typeof id !== "number") return;
    try {
      const res = await apiFetchStaff(STAFF_API.reactMessage(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.message_id != null) {
          const list: ChatReaction[] = Array.isArray(data.reactions) ? data.reactions : [];
          setGroupMessages((prev) => prev.map((m) => String(m.id) === String(data.message_id) ? { ...m, reactions: list } : m));
        }
      }
    } catch {}
  }

  async function reactToDmMessage(id: number | string, emoji: string) {
    setThreads((prev) => prev.map((t) => ({
      ...t,
      messages: t.messages.map((m) => String(m.id) === String(id)
        ? { ...m, reactions: toggleReactionLocal(m.reactions, emoji) }
        : m),
    })));
    if (typeof id !== "number") return;
    try {
      const res = await apiFetchStaff(STAFF_API.reactMessage(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.message_id != null) {
          const list: ChatReaction[] = Array.isArray(data.reactions) ? data.reactions : [];
          setThreads((prev) => prev.map((t) => ({
            ...t,
            messages: t.messages.map((m) => String(m.id) === String(data.message_id) ? { ...m, reactions: list } : m),
          })));
        }
      }
    } catch {}
  }

  return (
    <section className="flex h-[calc(100vh-7rem)] w-full flex-col">
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
        <button onClick={() => switchTab("group")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "group" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
          Group Chat
        </button>
        <button onClick={() => switchTab("dm")} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "dm" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
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
        <div className="flex min-h-0 flex-1 w-full overflow-hidden">
          <ChatLayout
            mode="group"
            title="Group chat"
            messages={groupMessages}
            myId={staffProfile?.id}
            body={groupBody}
            setBody={setGroupBody}
            attachment={groupAttachment}
            setAttachment={setGroupAttachment}
            send={sendGroupMessage}
            sending={groupSending}
            mentionableUsers={mentionableUsers}
            onRefresh={loadGroupMessages}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onReplyMessage={(msg: any) => setReplyingTo(msg)}
            onReactMessage={reactToGroupMessage}
            onEditMessage={(msg: any) => {
              const newContent = prompt("Edit message:", msg.content ?? msg.body ?? "");
              if (newContent === null) return;
              apiFetchStaff(STAFF_API.editGroupMessage(msg.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent, attachment_url: msg.attachment_url || null }),
              }).then((r) => r.ok ? r.json() : null).then((data) => {
                if (!data) return;
                setGroupMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, content: data.content, edited_at: data.edited_at } : m));
              }).catch(() => {});
            }}
            onDeleteMessage={(id: number) => {
              if (!confirm("Delete this message?")) return;
              apiFetchStaff(STAFF_API.deleteGroupMessage(id), { method: "POST" })
                .then((r) => r.ok ? setGroupMessages((prev) => prev.filter((m) => m.id !== id)) : null)
                .catch(() => {});
            }}
          />
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
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onReplyMessage={(msg: any) => setReplyingTo(msg)}
            onReactMessage={reactToDmMessage}
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
              apiFetchStaff(STAFF_API.deleteDmMessage(id), { method: "POST" })
                .then((r) => r.ok ? setThreads((prev) => prev.map((t) => t.thread_id === tid ? { ...t, messages: t.messages.filter((m) => m.id !== id) } : t)) : null)
                .catch(() => {});
            }}
          />
        </div>
      )}
    </section>
  );
}
