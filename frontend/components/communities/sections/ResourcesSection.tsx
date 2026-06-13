"use client";

import * as React from "react";
import type { Community, Section } from "@/services/communityService";
import { PostComposer } from "@/components/posts/PostComposer";
import { FeedList } from "@/components/posts/FeedList";
import { BookOpen } from "lucide-react";

interface ResourcesSectionProps {
  wave: Community;
  section: Section;
  isMember: boolean;
}

export function ResourcesSection({ wave, section, isMember }: ResourcesSectionProps) {
  // We can track refreshing the feed when a new post is created
  const [key, setKey] = React.useState(0);

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center gap-3 p-4 bg-muted/30 border rounded-xl">
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">{section.name}</h2>
          <p className="text-sm text-muted-foreground">{section.description || "Share links, files, and educational materials."}</p>
        </div>
      </div>

      {isMember && (
        <PostComposer 
          communityId={wave.id} 
          sectionId={section.id} 
          placeholder="Share a resource link..."
          onPostCreated={() => setKey(prev => prev + 1)} 
        />
      )}
      
      <div className="mt-8">
        <FeedList 
          key={`resources-feed-${key}`} 
          communityId={wave.id} 
          sectionId={section.id} 
        />
      </div>
    </div>
  );
}
