"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "Explore Waves", href: "/waves", icon: Compass },
  ];

  return (
    <div className="flex flex-col h-full p-4">
      <Link href="/feed" className="flex items-center gap-2 px-4 py-6 mb-4">
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-indigo-500">
          tarng
        </span>
      </Link>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-full px-4 py-3 text-lg font-medium transition-all active:scale-95",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              {item.name}
            </Link>
          );
        })}

        <Link
          href="/notifications"
          className={cn(
            "flex items-center gap-4 rounded-full px-4 py-3 text-lg font-medium transition-all active:scale-95",
            pathname.startsWith("/notifications")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <NotificationBell className="h-6 w-6" />
          Notifications
        </Link>

        {user && (
          <Link
            href={`/profile/${user.username}`}
            className={cn(
              "flex items-center gap-4 rounded-full px-4 py-3 text-lg font-medium transition-all active:scale-95",
              pathname.startsWith(`/profile/${user.username}`)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <User className="h-6 w-6" />
            Profile
          </Link>
        )}
      </nav>

      <div className="mt-auto mb-4">
        <Link 
          href="/post/create"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary p-4 text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg hover:shadow-xl hover:-translate-y-0.5 shadow-primary/25"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="hidden lg:inline">Post</span>
        </Link>
      </div>
    </div>
  );
}
