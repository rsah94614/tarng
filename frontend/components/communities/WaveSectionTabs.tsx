"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Section } from "@/services/communityService";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface WaveSectionTabsProps {
  waveSlug: string;
  sections: Section[];
  activeSectionSlug?: string;
  childrenCount: number;
}

export function WaveSectionTabs({ waveSlug, sections, activeSectionSlug, childrenCount }: WaveSectionTabsProps) {
  const pathname = usePathname();
  
  // If no explicit active section, default to the first one (usually feed)
  const currentSlug = activeSectionSlug || sections[0]?.slug;

  return (
    <div className="w-full border-b border-border mt-6">
      <div className="flex overflow-x-auto hide-scrollbar -mb-px">
        {sections.filter(s => s.is_visible).map((section) => {
          const isActive = currentSlug === section.slug;
          // Dynamically load icon if it exists, fallback to standard icons based on type
          let Icon = (LucideIcons as any)[section.icon || ""] || null;
          
          if (!Icon) {
            switch(section.section_type) {
              case "feed": Icon = LucideIcons.Rss; break;
              case "discussion": Icon = LucideIcons.MessageSquare; break;
              case "members": Icon = LucideIcons.Users; break;
              case "about": Icon = LucideIcons.Info; break;
              case "announcements": Icon = LucideIcons.Megaphone; break;
              case "resources": Icon = LucideIcons.Library; break;
              default: Icon = LucideIcons.Hash;
            }
          }

          return (
            <Link
              key={section.id}
              href={`/waves/${waveSlug}/${section.slug}`}
              className={cn(
                "whitespace-nowrap flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {section.name}
            </Link>
          );
        })}

        {/* Sub-Waves Tab - only show if there are children or if user is admin (can create) - for now just show if children > 0 */}
        {childrenCount > 0 && (
          <Link
            href={`/waves/${waveSlug}/sub-waves`}
            className={cn(
              "whitespace-nowrap flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors",
              currentSlug === "sub-waves"
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <LucideIcons.Network className="h-4 w-4" />
            Sub-Waves
            <span className="ml-1 bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">
              {childrenCount}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
