"use client";

import * as React from "react";
import { WaveHeader } from "@/components/communities/WaveHeader";
import { WaveBreadcrumb } from "@/components/communities/WaveBreadcrumb";
import { WaveSectionTabs } from "@/components/communities/WaveSectionTabs";
import { WaveSectionRouter } from "@/components/communities/WaveSectionRouter";
import { communityService, type Community } from "@/services/communityService";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/useAuthStore";

interface WavePageRendererProps {
  slug: string;
  sectionSlug?: string;
}

export function WavePageRenderer({ slug, sectionSlug }: WavePageRendererProps) {
  const { user } = useAuthStore();
  const [wave, setWave] = React.useState<Community | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  
  // A simple hack to determine member status for now. 
  // Ideally backend should return `is_member` on the Wave object itself.
  const [isMember, setIsMember] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    
    let mounted = true;
    setLoading(true);
    
    communityService.getCommunity(slug)
      .then(async (data) => {
        if (mounted) {
          setWave(data);
          // Fetch members to check if current user is member
          if (user) {
            try {
              const members = await communityService.getMembers(slug);
              setIsMember(members.some(m => m.user_id === user.id));
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [slug, user]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !wave) {
    return (
      <div className="pt-8 px-4">
        <EmptyState title="Wave not found" description="This community might not exist or has been removed." />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="px-4 sm:px-6 pt-6">
        <WaveBreadcrumb currentWaveSlug={wave.slug} currentWaveName={wave.name} />
      </div>
      
      <WaveHeader wave={wave} />
      
      <div className="px-4 sm:px-6">
        <WaveSectionTabs 
          waveSlug={wave.slug} 
          sections={wave.sections} 
          activeSectionSlug={sectionSlug} 
          childrenCount={wave.children_count}
        />
        
        <div className="pb-12">
          <WaveSectionRouter wave={wave} activeSectionSlug={sectionSlug} isMember={isMember} />
        </div>
      </div>
    </div>
  );
}
