"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Community } from "@/services/communityService";
import { communityService } from "@/services/communityService";
import { WaveCard } from "./WaveCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Network } from "lucide-react";

interface WaveChildrenGridProps {
  wave: Community;
}

export function WaveChildrenGrid({ wave }: WaveChildrenGridProps) {
  const [children, setChildren] = React.useState<Community[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    communityService.getChildren(wave.slug)
      .then((data) => {
        if (mounted) setChildren(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [wave.slug]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner /></div>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Sub-Waves</h2>
        {wave.depth < 3 && (
          <Link 
            href={`/waves/${wave.slug}/create-sub`}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Sub-Wave
          </Link>
        )}
      </div>

      {children.length === 0 ? (
        <EmptyState 
          icon={<Network />} 
          title="No sub-waves yet" 
          description="Create a sub-wave to organize more specific discussions." 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children.map(child => (
            <WaveCard key={child.id} wave={child} />
          ))}
        </div>
      )}
    </div>
  );
}
