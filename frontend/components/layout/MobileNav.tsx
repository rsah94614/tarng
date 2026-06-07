"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "Explore", href: "/waves", icon: Compass },
    { name: "Notifications", href: "/notifications", icon: NotificationBell },
    { name: "Profile", href: user ? `/profile/${user.username}` : "/login", icon: User },
  ];

  return (
    <nav className="flex items-center justify-around p-3 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && item.href !== "/login";
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
