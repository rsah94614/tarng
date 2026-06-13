import * as React from "react";
import type { Community, Section } from "@/services/communityService";
import { FeedSection } from "./sections/FeedSection";
import { MembersSection } from "./sections/MembersSection";
import { AboutSection } from "./sections/AboutSection";
import { GallerySection } from "./sections/GallerySection";
import { ResourcesSection } from "./sections/ResourcesSection";
import { WaveChildrenGrid } from "./WaveChildrenGrid";

interface WaveSectionRouterProps {
  wave: Community;
  activeSectionSlug?: string;
  isMember: boolean;
}

export function WaveSectionRouter({ wave, activeSectionSlug, isMember }: WaveSectionRouterProps) {
  const currentSlug = activeSectionSlug || wave.sections[0]?.slug;

  if (currentSlug === "sub-waves") {
    return <WaveChildrenGrid wave={wave} />;
  }

  const section = wave.sections.find((s) => s.slug === currentSlug);

  if (!section) {
    return <div className="p-8 text-center text-muted-foreground">Section not found</div>;
  }

  switch (section.section_type) {
    case "members":
      return <MembersSection waveSlug={wave.slug} />;
    
    case "about":
      return <AboutSection wave={wave} section={section} />;
    
    case "gallery":
      return <GallerySection communityId={wave.id} sectionId={section.id} />;
      
    case "resources":
      return <ResourcesSection wave={wave} section={section} isMember={isMember} />;
      
    case "feed":
    case "discussion":
    case "announcements":
    case "custom":
    default:
      // All these render as a feed for MVP
      // For announcements, we might restrict who can post in the composer
      return (
        <FeedSection 
          wave={wave} 
          section={section} 
          isMember={isMember} 
        />
      );
  }
}
