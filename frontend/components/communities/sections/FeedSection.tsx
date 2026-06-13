"use client";

import * as React from "react";
import type { Community, Section } from "@/services/communityService";
import { PostComposer } from "@/components/posts/PostComposer";
import { FeedList } from "@/components/posts/FeedList";

interface FeedSectionProps {
  wave: Community;
  section: Section;
  isMember: boolean;
}

export function FeedSection({ wave, section, isMember }: FeedSectionProps) {
  // Simple check for if user can post here
  // MVP: announcements -> only owner/admin can post. Since we don't have role easily accessible here yet, 
  // we'll just let the backend reject it if unauthorized for now, or just show composer to all members.
  // Ideally we'd check member role.
  const canPost = isMember;

  return (
    <div className="space-y-6 mt-6">
      {canPost && (
        <PostComposer 
          communityId={wave.id} 
          sectionId={section.id} 
          placeholder={`Post in ${section.name}...`} 
        />
      )}
      <FeedList communityId={wave.id} sectionId={section.id} />
    </div>
  );
}
