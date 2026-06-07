"use client";

import * as React from "react";
import { communityService, type Community } from "@/services/communityService";
import { WaveCard } from "./WaveCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Compass } from "lucide-react";

export function WaveList() {
  const [waves, setWaves] = React.useState<Community[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    communityService.listCommunities(0, 50)
      .then((data) => {
        if (mounted) setWaves(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <EmptyState title="Could not load Waves" description="Please try again later." />;
  }

  if (waves.length === 0) {
    return (
      <EmptyState
        icon={<Compass />}
        title="No Waves yet"
        description="Be the first to create a community!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {waves.map((wave) => (
        <WaveCard key={wave.id} wave={wave} />
      ))}
    </div>
  );
}
