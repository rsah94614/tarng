"use client";

import * as React from "react";
import { communityService } from "@/services/communityService";
import type { CommunityMember } from "@/services/communityService";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembersSectionProps {
  waveSlug: string;
}

export function MembersSection({ waveSlug }: MembersSectionProps) {
  const [members, setMembers] = React.useState<CommunityMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    communityService.getMembers(waveSlug)
      .then((data) => {
        if (mounted) setMembers(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [waveSlug]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner /></div>;
  }

  if (members.length === 0) {
    return <EmptyState icon={<Users />} title="No members yet" />;
  }

  return (
    <div className="mt-6 space-y-4">
      {members.map((member) => (
        <div key={member.user_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
          <Avatar src={member.avatar_url} alt={member.username || ""} />
          <div className="flex-1">
            <h4 className="font-semibold">{member.display_name || member.username}</h4>
            <p className="text-sm text-muted-foreground">@{member.username}</p>
          </div>
          <div className={cn(
            "text-xs px-2 py-1 rounded-full border",
            member.role === "owner" ? "bg-primary/10 text-primary border-primary/20" :
            member.role === "admin" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
            member.role === "moderator" ? "bg-green-500/10 text-green-500 border-green-500/20" :
            "bg-muted text-muted-foreground"
          )}>
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </div>
        </div>
      ))}
    </div>
  );
}
