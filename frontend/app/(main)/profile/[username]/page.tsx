"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { userService } from "@/services/userService";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { User } from "@/types";
// For V1, we'll just show the header. A real app would show the user's posts.

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [prevUsername, setPrevUsername] = React.useState(username);
  if (username !== prevUsername) {
    setPrevUsername(username);
    setLoading(true);
    setProfile(null);
    setError(false);
  }

  React.useEffect(() => {
    if (!username) return;

    let mounted = true;

    userService.getProfile(username)
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [username]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !profile) {
    return (
      <div className="pt-8 px-4">
        <EmptyState title="User not found" description="This account might not exist or has been removed." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <ProfileHeader profile={profile} />
      
      <div className="px-4 sm:px-6">
        <EmptyState
          title={`Posts by @${profile.username}`}
          description="User post history will be available in future updates."
        />
      </div>
    </div>
  );
}
