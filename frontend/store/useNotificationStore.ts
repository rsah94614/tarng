import { create } from "zustand";
import type { Notification } from "@/types";
import { wsManager } from "@/lib/websocket";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  initWebSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
    })),

  markAsRead: (id) =>
    set((state) => {
      const targetId = typeof id === "string" ? parseInt(id, 10) : id;
      const alreadyRead = state.notifications.find((n) => n.id === targetId)?.is_read;
      if (alreadyRead) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === targetId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  initWebSocket: () => {
    // Listen for notification events via WS
    wsManager.on("notification", (data: unknown) => {
      // The payload structure matches the backend NotificationOut
      get().addNotification(data as Notification);
    });
  },
}));
