"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { WaveHeader } from "@/components/communities/WaveHeader";
import { FeedList } from "@/components/posts/FeedList";
import { PostComposer } from "@/components/posts/PostComposer";
import { communityService, type Community } from "@/services/communityService";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Post } from "@/types";

export default function WaveDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [wave, setWave] = React.useState<Community | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [newPost, setNewPost] = React.useState<Post | null>(null);

  const [prevSlug, setPrevSlug] = React.useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setLoading(true);
    setWave(null);
    setError(false);
    setNewPost(null);
  }

  React.useEffect(() => {
    if (!slug) return;
    
    let mounted = true;
    
    communityService.getCommunity(slug)
      .then((data) => {
        if (mounted) setWave(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [slug]);

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
    <div className="space-y-6">
      <WaveHeader wave={wave} />
      
      <div className="px-4 sm:px-6 space-y-6 pb-12">
        <PostComposer communityId={wave.id} onPostCreated={setNewPost} />
        <FeedList communityId={wave.id} newPost={newPost} />
      </div>
    </div>
  );
}
