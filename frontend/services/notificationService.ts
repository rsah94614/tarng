import api from "@/lib/axios";
import type { Notification } from "@/types";

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

export const notificationService = {
  async getNotifications(skip = 0, limit = 30): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>("/notifications", {
      params: { skip, limit },
    });
    return data;
  },

  async markAllRead(): Promise<{ marked_read: number }> {
    const { data } = await api.patch<{ marked_read: number }>("/notifications/read-all");
    return data;
  },

  async markRead(notificationId: number): Promise<{ marked_read: boolean }> {
    const { data } = await api.patch<{ marked_read: boolean }>(`/notifications/${notificationId}/read`);
    return data;
  },
};
