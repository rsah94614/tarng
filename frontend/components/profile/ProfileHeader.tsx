"use client";

import * as React from "react";
import { Settings, Calendar } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

export interface ProfileHeaderProps {
  profile: User;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user: currentUser } = useAuthStore();
  const isOwner = currentUser?.id === profile.id;

  return (
    <div className="bg-card border-b pb-6">
      <div className="h-32 md:h-48 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      
      <div className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
          <Avatar
            src={profile.avatar_url}
            alt={profile.username}
            size="2xl"
            className="border-4 border-card bg-card shadow-sm h-32 w-32 sm:h-40 sm:w-40"
          />
          
          {isOwner && (
            <Link
              href="/settings/profile"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 font-medium hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Link>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
          <p className="text-muted-foreground font-medium">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="mt-4 max-w-2xl text-base whitespace-pre-wrap">{profile.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Joined <TimeAgo date={profile.created_at} /></span>
          </div>
          {profile.language_preference && (
            <div className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
              {profile.language_preference.toUpperCase()}
            </div>
          )}
        </div>

        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
