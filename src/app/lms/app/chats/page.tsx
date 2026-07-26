"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatLayout from "../../../../components/chat/ChatLayout";
import type { ChatMessage, ChatBootstrap, StudentProfile } from "../../../../lib/lms-types";
import { getToken } from "../../../../lib/lms-utils";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../../lib/api";
import { getPusher, disconnectPusher } from "../../../../lib/reverb-client";

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
  const [mentionableUsers, setMentionableUsers] = useState<{ id: number; name: string; username: string; role: string }[]>([]);
  const [unreadGroup, setUnreadGroup] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);
  const chatTabRef = useRef<"track" | "dm">("track");

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;

    // Show chat UI immediately (empty state), populate as data arrives
    const bootstrapPromise = fetch(STUDENT_API.chatBootstrap, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((p) => setChatBootstrap(p));

    fetch(STUDENT_API.profile, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((p) => setProfile(p));

    fetch(STUDENT_API.chatGroupMentionable, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((p) => setMentionableUsers(Array.isArray(p) ? p : []));

    // Unblock UI as soon as bootstrap arrives
    bootstrapPromise.then(() => {
      setLoading(false);
      markReadOnBackend("track");
    });

    // Load messages in the background
    fetch(STUDENT_API.chatGroupMessages, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((p) => setGroupMessages(Array.isArray(p) ? p : []));

    fetch(STUDENT_API.chatDmMessages, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((p) => setDmMessages(Array.isArray(p) ? p : []));
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

  function markReadOnBackend(tab: "track" | "dm") {
    if (!token) return;
    const api = tab === "track" ? STUDENT_API.chatGroupMarkRead : STUDENT_API.chatDmMarkRead;
    fetch(api, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      .then(() => window.dispatchEvent(new CustomEvent("opencode:chat-read")))
      .catch(() => {});
  }

  function switchTab(tab: "track" | "dm") {
    setChatTab(tab);
    if (tab === "track") setUnreadGroup(0);
    if (tab === "dm") setUnreadDm(0);
    markReadOnBackend(tab);
  }

  async function sendMessage() {
    if (!chatBody.trim() && !chatAttachmentUrl.trim()) return;
    const contentToSend = chatBody;
    const attachmentToSend = chatAttachmentUrl;
    setChatBody("");
    setChatAttachmentUrl("");

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

    try {
      const endpoint = isGroup ? STUDENT_API.chatGroupMessages : STUDENT_API.chatDmMessages;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        fetch(STUDENT_API.chatGroupMessages, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => { if (r.ok) { const p = await r.json(); setGroupMessages(Array.isArray(p) ? p : []); } }),
        fetch(STUDENT_API.chatDmMessages, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => { if (r.ok) { const p = await r.json(); setDmMessages(Array.isArray(p) ? p : []); } }),
      ]);
    } catch {}
  }

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
      onEditMessage={(msg: any) => {
        const newContent = prompt("Edit message:", msg.content ?? msg.body ?? "");
        if (newContent === null) return;
        const isGroup = chatTab === "track";
        const api = isGroup ? STUDENT_API.editGroupMessage(msg.id) : STUDENT_API.editDmMessage(msg.id);
        fetch(api, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        fetch(api, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.ok ? (isGroup ? setGroupMessages((prev) => prev.filter((m) => m.id !== id)) : setDmMessages((prev) => prev.filter((m) => m.id !== id))) : null)
          .catch(() => {});
      }}
    />
  );
}
