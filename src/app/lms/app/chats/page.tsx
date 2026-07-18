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

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(STUDENT_API.chatBootstrap, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setChatBootstrap(p)),
      fetch(STUDENT_API.chatGroupMessages, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setGroupMessages(Array.isArray(p) ? p : [])),
      fetch(STUDENT_API.chatDmMessages, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setDmMessages(Array.isArray(p) ? p : [])),
      fetch(STUDENT_API.profile, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setProfile(p)),
      fetch(STUDENT_API.chatGroupMentionable, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((p) => setMentionableUsers(Array.isArray(p) ? p : [])),
    ]).then(() => setLoading(false));
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
          return [...prev, data];
        });
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
          return [...prev, data];
        });
      });
    }
  }, [token, chatBootstrap]);

  async function sendMessage() {
    if (!chatBody.trim()) return;
    setSending(true);
    try {
      const endpoint = chatTab === "track" ? STUDENT_API.chatGroupMessages : STUDENT_API.chatDmMessages;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: chatBody,
          attachment_url: chatAttachmentUrl || null,
        }),
      });

      const payload = await response.json();

      if (response.ok) {
        if (chatTab === "track") {
          setGroupMessages((prev) => [...prev, payload]);
        } else {
          setDmMessages((prev) => [...prev, payload]);
        }
        setChatBody("");
        setChatAttachmentUrl("");
      }
    } finally {
      setSending(false);
    }
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
      setChatTab={setChatTab}
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
