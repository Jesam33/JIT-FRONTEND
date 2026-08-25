"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatLayout from "../../../../components/chat/ChatLayout";
import type { ChatMessage, ChatBootstrap, StudentProfile } from "../../../../lib/lms-types";
import { getToken } from "../../../../lib/lms-utils";
import { apiFetch, okJson } from "../../../../lib/fetch-with-timeout";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../../lib/api";
import { getPusher, disconnectPusher, isPusherConnected } from "../../../../lib/reverb-client";
import { toggleReactionLocal, applyReactionsToList, applyReactionBroadcast } from "../../../../lib/chat-reactions";
import type { ChatReaction } from "../../../../lib/lms-types";

// Change-detection helpers for the polling fallback: only replace message state
// when the tail actually moved, so idle polls cause no re-render or scroll jump,
// and never clobber an in-flight optimistic ("temp-") send.
function tailId(list: { id: unknown }[]): unknown {
  return list.length ? list[list.length - 1].id : null;
}
function listUnchanged(a: { id: unknown }[], b: { id: unknown }[]): boolean {
  return a.length === b.length && tailId(a) === tailId(b);
}
function hasPendingTemp(list: { id: unknown }[]): boolean {
  return list.some((m) => typeof m.id === "string" && (m.id as string).startsWith("temp-"));
}

export default function StudentChatsPage() {
  const [chatBootstrap, setChatBootstrap] = useState<ChatBootstrap | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [chatTab, setChatTab] = useState<"track" | "dm">("track");
  const [chatBody, setChatBody] = useState("");
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mentionableUsers, setMentionableUsers] = useState<{ id: number; name: string; username: string; role: string }[]>([]);
  const [unreadGroup, setUnreadGroup] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);
  const chatTabRef = useRef<"track" | "dm">("track");

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;

    // Show chat UI immediately (empty state), populate as data arrives.
    // bootstrap + profile are object-shape: gate on r.ok so an error body is
    // never set as state (it stays null → the empty chat shell, not garbage).
    const bootstrapPromise = apiFetch(STUDENT_API.chatBootstrap)
      .then(okJson).then((p) => setChatBootstrap(p)).catch(() => {});

    apiFetch(STUDENT_API.profile)
      .then(okJson).then((p) => setProfile(p)).catch(() => {});

    apiFetch(STUDENT_API.chatGroupMentionable)
      .then((r) => r.json()).then((p) => setMentionableUsers(Array.isArray(p) ? p : [])).catch(() => {});

    // Unblock UI as soon as bootstrap arrives
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
      channel.bind("reaction.updated", (data: { message_id: number; reactions: ChatReaction[] }) => {
        if (!data || data.message_id == null) return;
        setGroupMessages((prev) => applyReactionBroadcast(prev, data.message_id, data.reactions));
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
      channel.bind("reaction.updated", (data: { message_id: number; reactions: ChatReaction[] }) => {
        if (!data || data.message_id == null) return;
        setDmMessages((prev) => applyReactionBroadcast(prev, data.message_id, data.reactions));
      });
    }
  }, [token, chatBootstrap]);

  // Keep chatTabRef in sync so WebSocket callbacks can read the latest tab
  useEffect(() => {
    chatTabRef.current = chatTab;
  }, [chatTab]);

  function markReadOnBackend(tab: "track" | "dm") {
    if (!token) return;
    const api = tab === "track" ? STUDENT_API.chatGroupMarkRead : STUDENT_API.chatDmMarkRead;
    apiFetch(api, { method: "POST" })
      .then(() => window.dispatchEvent(new CustomEvent("opencode:chat-read")))
      .catch(() => {});
  }

  function switchTab(tab: "track" | "dm") {
    setChatTab(tab);
    setReplyingTo(null);
    if (tab === "track") setUnreadGroup(0);
    if (tab === "dm") setUnreadDm(0);
    markReadOnBackend(tab);
  }

  async function sendMessage() {
    if (!chatBody.trim() && !chatAttachmentUrl.trim()) return;
    const contentToSend = chatBody;
    const attachmentToSend = chatAttachmentUrl;
    // Only real (numeric) message ids can be threaded; a not-yet-confirmed
    // temp id would fail the backend's integer validation.
    const replyTarget = replyingTo;
    const replyToId = typeof replyTarget?.id === "number" ? replyTarget.id : null;
    setChatBody("");
    setChatAttachmentUrl("");
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId as any,
      content: contentToSend,
      attachment_url: attachmentToSend || null,
      sender_role: "student",
      sender_id: profile?.id ?? 0,
      sender_name: profile ? `${profile.first_name} ${profile.last_name}` : "You",
      created_at: new Date().toISOString(),
      reply_to_id: replyToId,
      reply_to: replyToId && replyTarget ? {
        id: replyToId,
        content: replyTarget.content ?? replyTarget.body ?? null,
        sender_role: replyTarget.sender_role ?? replyTarget.from_role,
        sender_name: replyTarget.sender_name ?? null,
      } : null,
      reactions: [],
    };

    const isGroup = chatTab === "track";
    if (isGroup) {
      setGroupMessages((prev) => [...prev, tempMsg]);
    } else {
      setDmMessages((prev) => [...prev, tempMsg]);
    }

    try {
      const endpoint = isGroup ? STUDENT_API.chatGroupMessages : STUDENT_API.chatDmMessages;
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToSend,
          attachment_url: attachmentToSend || null,
          reply_to_id: replyToId,
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

  // Optimistically toggle the viewer's reaction, then POST and reconcile with
  // the authoritative counts the server returns. Other clients pick up the
  // change through the `reaction.updated` broadcast.
  async function reactToMessage(id: number | string, emoji: string) {
    const isGroup = chatTab === "track";
    const setter = isGroup ? setGroupMessages : setDmMessages;
    setter((prev) => prev.map((m) => String(m.id) === String(id)
      ? { ...m, reactions: toggleReactionLocal(m.reactions, emoji) }
      : m));
    if (typeof id !== "number") return;
    try {
      const res = await apiFetch(STUDENT_API.reactMessage(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.message_id != null) {
          setter((prev) => applyReactionsToList(prev, data.message_id, Array.isArray(data.reactions) ? data.reactions : []));
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

  // Fallback delivery: when the live socket isn't connected (Reverb/Pusher not
  // configured, or mid-reconnect) refresh on an interval so new messages still
  // appear without a manual refresh. Stays inert while push is active and while
  // the tab is hidden; skips when a send is mid-flight or nothing changed so it
  // never clobbers an optimistic message or forces a scroll jump.
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      if (document.hidden || isPusherConnected()) return;
      try {
        const [g, d] = await Promise.all([
          apiFetch(STUDENT_API.chatGroupMessages).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          apiFetch(STUDENT_API.chatDmMessages).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (Array.isArray(g)) setGroupMessages((prev) => (hasPendingTemp(prev) || listUnchanged(prev, g) ? prev : g));
        if (Array.isArray(d)) setDmMessages((prev) => (hasPendingTemp(prev) || listUnchanged(prev, d) ? prev : d));
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

  if (loading) return <LoadingSpinner />;

  return (
    <ChatLayout
      mode="student"
      chatTab={chatTab}
      setChatTab={switchTab}
      chatBootstrap={chatBootstrap}
      groupMessages={groupMessages}
      dmMessages={dmMessages}
      chatBody={chatBody}
      setChatBody={setChatBody}
      chatAttachmentUrl={chatAttachmentUrl}
      setChatAttachmentUrl={setChatAttachmentUrl}
      profile={profile}
      sendMessage={sendMessage}
      sending={sending}
      mentionableUsers={mentionableUsers}
      onRefresh={refreshChats}
      unreadGroup={unreadGroup}
      unreadDm={unreadDm}
      replyingTo={replyingTo}
      onCancelReply={() => setReplyingTo(null)}
      onReplyMessage={(msg: any) => setReplyingTo(msg)}
      onReactMessage={reactToMessage}
      onEditMessage={(msg: any) => {
        const newContent = prompt("Edit message:", msg.content ?? msg.body ?? "");
        if (newContent === null) return;
        const isGroup = chatTab === "track";
        const api = isGroup ? STUDENT_API.editGroupMessage(msg.id) : STUDENT_API.editDmMessage(msg.id);
        apiFetch(api, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent, attachment_url: msg.attachment_url || null }),
        }).then((r) => r.ok ? r.json() : null).then((data) => {
          if (!data) return;
          if (isGroup) {
            setGroupMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, content: data.content, edited_at: data.edited_at } : m));
          } else {
            setDmMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, content: data.content, edited_at: data.edited_at } : m));
          }
        }).catch(() => {});
      }}
      onDeleteMessage={(id: number) => {
        if (!confirm("Delete this message?")) return;
        const isGroup = chatTab === "track";
        const api = isGroup ? STUDENT_API.deleteGroupMessage(id) : STUDENT_API.deleteDmMessage(id);
    apiFetch(api, { method: "POST" })
          .then((r) => r.ok ? (isGroup ? setGroupMessages((prev) => prev.filter((m) => m.id !== id)) : setDmMessages((prev) => prev.filter((m) => m.id !== id))) : null)
          .catch(() => {});
      }}
    />
  );
}
