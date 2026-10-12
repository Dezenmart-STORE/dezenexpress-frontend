"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notificationsApi } from "@/lib/dezenmart-api";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ─── Shared global state so Sidebar badge and NotificationsPage stay in sync ──
let globalNotifications: Notification[] = [];
let globalListeners: Array<(n: Notification[]) => void> = [];

function setGlobal(notifications: Notification[]) {
  globalNotifications = notifications;
  globalListeners.forEach((fn) => fn(notifications));
}

function subscribe(fn: (n: Notification[]) => void) {
  globalListeners.push(fn);
  return () => {
    globalListeners = globalListeners.filter((l) => l !== fn);
  };
}

// ─── Main hook — used by NotificationsPage ────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(globalNotifications);
  const [loading, setLoading] = useState(globalNotifications.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to global state changes
  useEffect(() => {
    const unsub = subscribe(setNotifications);
    return unsub;
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    notificationsApi
      .getAll()
      .then((all) => {
        const list = all as Notification[];
        setGlobal(list); // update global + all subscribers
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Only fetch if we don't have data yet
    if (globalNotifications.length === 0) load();
  }, [load]);

  // Derive unread count from the list — never trust a separate API call
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
    if (!unreadIds.length) return;
    try {
      await notificationsApi.markRead(unreadIds);
      // Update locally — don't wait for a re-fetch
      setGlobal(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await notificationsApi.markRead([id]);
      setGlobal(
        notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refetch: load,
    markAllRead,
    markOneRead,
  };
}

// ─── Lightweight hook for Sidebar badge — reads from shared global state ──────
export function useUnreadCount() {
  const [count, setCount] = useState(
    globalNotifications.filter((n) => !n.read).length,
  );
  const [loading, setLoading] = useState(globalNotifications.length === 0);
  const fetchedRef = useRef(false);

  // Subscribe to global state so badge updates when NotificationsPage marks read
  useEffect(() => {
    const unsub = subscribe((notifications) => {
      setCount(notifications.filter((n) => !n.read).length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Only fetch once — if NotificationsPage already fetched, we'll get it via subscription
    if (fetchedRef.current || globalNotifications.length > 0) {
      setLoading(false);
      return;
    }
    fetchedRef.current = true;
    notificationsApi
      .getAll()
      .then((all) => {
        const list = all as Notification[];
        setGlobal(list);
        setCount(list.filter((n) => !n.read).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { count, loading };
}
