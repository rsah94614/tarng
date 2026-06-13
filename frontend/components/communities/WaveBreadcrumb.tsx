"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { CommunityBrief } from "@/services/communityService";
import { communityService } from "@/services/communityService";

interface WaveBreadcrumbProps {
  currentWaveSlug: string;
  currentWaveName: string;
}

export function WaveBreadcrumb({ currentWaveSlug, currentWaveName }: WaveBreadcrumbProps) {
  const [ancestors, setAncestors] = React.useState<CommunityBrief[]>([]);

  React.useEffect(() => {
    let mounted = true;
    communityService.getAncestors(currentWaveSlug)
      .then((data) => {
        if (mounted) setAncestors(data);
      })
      .catch((err) => console.error("Failed to load ancestors", err));
    return () => { mounted = false; };
  }, [currentWaveSlug]);

  if (ancestors.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
      <Link href="/waves" className="hover:text-foreground transition-colors p-1">
        <Home className="h-4 w-4" />
      </Link>
      
      {ancestors.map((ancestor) => (
        <React.Fragment key={ancestor.id}>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link
            href={`/waves/${ancestor.slug}`}
            className="hover:text-foreground transition-colors truncate max-w-[150px]"
          >
            {ancestor.name}
          </Link>
        </React.Fragment>
      ))}
      
      <ChevronRight className="h-4 w-4 shrink-0" />
      <span className="font-medium text-foreground truncate max-w-[150px]">
        {currentWaveName}
      </span>
    </nav>
  );
}
