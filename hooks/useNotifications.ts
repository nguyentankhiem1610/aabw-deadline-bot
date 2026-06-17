"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { buildNotificationKey } from "@/lib/utils";
import type { AppNotification, Deadline } from "@/lib/types";

interface UseNotificationsReturn {
  notifications: AppNotification[];
  addNotification: (deadline: Deadline, window: 15 | 30) => void;
  dismissNotification: (id: string) => void;
  isIssued: (deadlineId: string, window: 15 | 30) => boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Session-scoped dedup set — persists for the lifetime of the component
  const issuedKeys = useRef<Set<string>>(new Set());
  const dismissedKeys = useRef<Set<string>>(new Set());

  // Hydrate dismissed alerts from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("aabw_dismissed_alerts");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            dismissedKeys.current = new Set(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to load dismissed alerts", e);
      }
    }
  }, []);

  const isIssued = useCallback((deadlineId: string, window: 15 | 30): boolean => {
    const key = buildNotificationKey(deadlineId, window);
    return issuedKeys.current.has(key) || dismissedKeys.current.has(key);
  }, []);

  const addNotification = useCallback((deadline: Deadline, window: 15 | 30) => {
    const key = buildNotificationKey(deadline.id, window);
    if (issuedKeys.current.has(key) || dismissedKeys.current.has(key)) return; // dedup guard

    issuedKeys.current.add(key);

    const notification: AppNotification = {
      id: uuidv4(),
      deadlineId: deadline.id,
      deadlineTitle: deadline.title,
      deadlineDatetime: deadline.datetime,
      proximityWindow: window,
      triggeredAt: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [notification, ...prev]);

    // Web Push (if browser permission granted)
    if (typeof window !== "undefined" && "Notification" in globalThis) {
      if (globalThis.Notification.permission === "granted") {
        try {
          new globalThis.Notification(`⏰ ${deadline.title}`, {
            body: `Starting in ${notification.proximityWindow} minutes`,
            tag: key,
          });
        } catch {
          // Web push blocked or unsupported — silently ignore
        }
      } else if (globalThis.Notification.permission === "default") {
        // Request permission (fire-and-forget)
        globalThis.Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target) {
        const key = buildNotificationKey(target.deadlineId, target.proximityWindow);
        dismissedKeys.current.add(key);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("aabw_dismissed_alerts", JSON.stringify(Array.from(dismissedKeys.current)));
          } catch (e) {
            console.error("Failed to save dismissed alerts", e);
          }
        }
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  return { notifications, addNotification, dismissNotification, isIssued };
}
