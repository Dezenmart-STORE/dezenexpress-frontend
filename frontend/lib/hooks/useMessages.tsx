"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dezenmart_logistics_token");
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message ?? `Request failed: ${res.status}`);
  return data as T;
}

export interface Participant {
  _id: string;
  name: string;
  email?: string;
  profileImage?: string;
}

export interface Message {
  _id: string;
  sender: Participant;
  recipient: Participant;
  content?: string;
  order?: string;
  fileUrl?: string;
  fileType?: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  participant: Participant;
  lastMessage: Message;
  unreadCount: number;
}

export const messagesApi = {
  getConversations: async () => {
    const res = await req<any>("/messages");
    console.log("Conversations response:", JSON.stringify(res, null, 2));
    // Handle different possible response shapes
    const conversations =
      res?.data?.conversations ??
      res?.conversations ??
      res?.data?.messages ??
      res?.data ??
      [];
    return {
      status: "success",
      data: {
        conversations: Array.isArray(conversations) ? conversations : [],
      },
    };
  },

  getThread: (userId: string, page = 1, limit = 30) =>
    req<{ status: string; data: { messages: Message[] } }>(
      `/messages/${userId}?page=${page}&limit=${limit}`,
    ),

  send: async (
    recipient: string,
    content: string,
    orderId?: string,
    file?: File,
  ) => {
    const token = getToken();
    const form = new FormData();
    form.append("recipient", recipient);
    if (content) form.append("content", content);
    if (orderId) form.append("order", orderId);
    if (file) form.append("messageFile", file);

    const res = await fetch(`${BASE}/messages`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Failed to send message");
    return data as { status: string; data: { message: Message } };
  },

  markRead: (messageIds: string[]) =>
    req<{ status: string }>("/messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds }),
    }),
};

// ── Hook: conversations list ──────────────────────────────────────────────────
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    messagesApi
      .getConversations()
      .then((res) => setConversations(res.data.conversations ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { conversations, loading, error, refetch: load, setConversations };
}

// ── Hook: message thread with polling ────────────────────────────────────────
export function useThread(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const myId = useRef<string | null>(null);

  // Get my user ID from token
  useEffect(() => {
    try {
      const token = getToken();
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      myId.current = payload.id ?? payload._id ?? null;
    } catch {}
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!userId) return;
      if (!silent) setLoading(true);
      try {
        const res = await messagesApi.getThread(userId);
        const msgs = (res.data.messages ?? []).reverse(); // oldest first
        setMessages(msgs);

        // Mark unread messages as read
        const unreadIds = msgs
          .filter((m) => !m.read && m.sender._id !== myId.current)
          .map((m) => m._id);
        if (unreadIds.length > 0)
          messagesApi.markRead(unreadIds).catch(() => {});
      } catch (err: unknown) {
        if (!silent)
          setError(
            err instanceof Error ? err.message : "Failed to load messages",
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId],
  );

  // Load on userId change + poll every 5 seconds
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
    load();
    pollRef.current = setInterval(() => load(true), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId, load]);

  const send = async (content: string, orderId?: string, file?: File) => {
    if (!userId || (!content.trim() && !file)) return;
    setSending(true);
    try {
      const res = await messagesApi.send(userId, content.trim(), orderId, file);
      setMessages((prev) => [...prev, res.data.message]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    error,
    send,
    refetch: load,
    myId: myId.current,
  };
}
