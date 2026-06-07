"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, UserPlus, Compass } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { notificationService } from "@/services/notificationService";

export interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const getIcon = () => {
    switch (notification.notification_type) {
      case "like":
        return <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />;
      case "comment":
      case "reply":
      case "mention":
        return <MessageSquare className="h-5 w-5 text-primary fill-primary" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-emerald-500" />;
      case "community_join":
        return <Compass className="h-5 w-5 text-amber-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-primary" />;
    }
  };

  const getLinkHref = () => {
    if (notification.post_id) {
      return `/post/${notification.post_id}`;
    }
    if (notification.notification_type === "community_join" && notification.community_id) {
       // Ideally we need wave slug here, but ID could route or just view profile
       return `/profile/${notification.actor_username}`; 
    }
    if (notification.actor_username) {
      return `/profile/${notification.actor_username}`;
    }
    return "#";
  };

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
      notificationService.markRead(Number(notification.id)).catch(console.error);
    }
  };

  return (
    <Link
      href={getLinkHref()}
      onClick={handleClick}
      className={cn(
        "flex gap-4 p-4 transition-colors hover:bg-muted/50 border-b last:border-0",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="mt-1 flex shrink-0 items-start justify-end w-8">
        {getIcon()}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {notification.actor_username && (
            <Avatar
              src={notification.actor_avatar_url}
              alt={notification.actor_username}
              size="sm"
            />
          )}
          <span className="text-sm font-medium">
            {notification.actor_username ? (
              <span className="font-bold hover:underline">
                {notification.actor_username}
              </span>
            ) : null}
          </span>
          <TimeAgo date={notification.created_at} className="text-muted-foreground ml-auto" />
        </div>
        <p className="text-sm text-foreground">{notification.message}</p>
      </div>
    </Link>
  );
}
