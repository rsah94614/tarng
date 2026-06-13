"use client";

import * as React from "react";
import { Users, LogIn, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { communityService, type Community } from "@/services/communityService";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface WaveHeaderProps {
  wave: Community;
}

export function WaveHeader({ wave }: WaveHeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  // Ideally, backend should return is_member for current user. 
  // For V1, we'll maintain state locally if they join/leave.
  const [joined, setJoined] = React.useState(false); // In real app, init from wave data
  
  const handleJoinToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (joined) {
        await communityService.leaveCommunity(wave.slug);
        setJoined(false);
      } else {
        await communityService.joinCommunity(wave.slug);
        setJoined(true);
      }
    } catch {
      console.error("Failed to toggle join status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border-b">
      <div className="relative h-48 md:h-64 w-full bg-muted">
        {wave.banner_url ? (
          <img src={wave.banner_url} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
        )}
      </div>

      <div className="px-4 pb-6 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 mb-4">
          <Avatar
            src={wave.avatar_url}
            alt={wave.name}
            size="2xl"
            className="border-4 border-card bg-card shadow-sm"
          />
          
          <button
            onClick={handleJoinToggle}
            disabled={loading || wave.created_by_id === user?.id}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2 font-bold transition-transform active:scale-95",
              joined
                ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading ? <Spinner size="sm" /> : joined ? <><LogOut className="h-4 w-4" /> Leave</> : <><LogIn className="h-4 w-4" /> Join Wave</>}
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold">{wave.name}</h1>
          <p className="text-muted-foreground font-medium">/{wave.slug}</p>
        </div>
        
        <p className="mt-4 max-w-2xl text-base whitespace-pre-wrap">
          {wave.description || "Welcome to our Wave!"}
        </p>

        <div className="mt-4 flex items-center gap-4 font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{wave.member_count} members</span>
          </div>
          {wave.children_count > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">&bull;</span>
              <span>{wave.children_count} sub-waves</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
