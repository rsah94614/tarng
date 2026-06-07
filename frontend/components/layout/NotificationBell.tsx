"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";

export type NotificationBellProps = React.SVGProps<SVGSVGElement>;

export function NotificationBell({ className, ...props }: NotificationBellProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <div className="relative inline-flex items-center justify-center">
      <Bell className={cn("h-6 w-6", className)} {...props} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}
