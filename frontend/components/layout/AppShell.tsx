"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { notificationService } from "@/services/notificationService";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications, initWebSocket } = useNotificationStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch initial notifications
      notificationService.getNotifications(0, 30).then((data) => {
        setNotifications(data.items, data.unread_count);
      });
      // Init real-time notifications
      initWebSocket();
    }
  }, [isAuthenticated, user, setNotifications, initWebSocket]);

  React.useEffect(() => {
    if (isMounted && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isMounted, isAuthenticated]);

  if (!isMounted || !isAuthenticated) {
    return null; // Return null while redirecting or hydrating
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border shrink-0 fixed inset-y-0 z-10 bg-background">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 lg:ml-72 pb-16 md:pb-0 min-h-screen">
        <div className="mx-auto max-w-3xl w-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-md">
        <MobileNav />
      </div>
    </div>
  );
}
