"use client";

import type { Community, Section } from "@/services/communityService";

interface AboutSectionProps {
  wave: Community;
  section: Section;
}

export function AboutSection({ wave, section }: AboutSectionProps) {
  return (
    <div className="mt-6 p-6 rounded-xl border bg-card text-card-foreground">
      <h2 className="text-xl font-bold mb-4">About {wave.name}</h2>
      
      {wave.description ? (
        <div className="prose dark:prose-invert max-w-none mb-8 whitespace-pre-wrap text-muted-foreground">
          {wave.description}
        </div>
      ) : (
        <p className="text-muted-foreground italic mb-8">No description provided.</p>
      )}

      <div className="grid grid-cols-2 gap-4 border-t pt-6 text-sm">
        <div>
          <span className="text-muted-foreground block mb-1">Created</span>
          <span className="font-medium">{new Date(wave.created_at).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Members</span>
          <span className="font-medium">{wave.member_count}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Visibility</span>
          <span className="font-medium">{wave.is_public ? "Public" : "Private"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Sub-Waves</span>
          <span className="font-medium">{wave.children_count}</span>
        </div>
      </div>
    </div>
  );
}
