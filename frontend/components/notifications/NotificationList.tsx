"use client";

import * as React from "react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationItem } from "./NotificationItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, CheckCheck } from "lucide-react";
import { notificationService } from "@/services/notificationService";

export function NotificationList() {
  const { notifications, markAllAsRead, unreadCount } = useNotificationStore();

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell />}
        title="All caught up!"
        description="You don't have any notifications right now."
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <h2 className="font-bold text-lg">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {notifications.map((notif) => (
          <NotificationItem key={notif.id} notification={notif} />
        ))}
      </div>
    </div>
  );
}
