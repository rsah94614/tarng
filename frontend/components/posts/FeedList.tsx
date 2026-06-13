"use client";

import * as React from "react";
import { postService } from "@/services/postService";
import type { Post } from "@/types";
import { PostCard } from "./PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react";

export interface FeedListProps {
  communityId?: number;
  sectionId?: number;
  newPost?: Post | null;
}

export function FeedList({ communityId, sectionId, newPost }: FeedListProps) {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [prevProps, setPrevProps] = React.useState({ communityId, sectionId });
  if (communityId !== prevProps.communityId || sectionId !== prevProps.sectionId) {
    setPrevProps({ communityId, sectionId });
    setLoading(true);
    setPosts([]);
    setError(false);
  }

  const [prevNewPost, setPrevNewPost] = React.useState(newPost);
  if (newPost !== prevNewPost) {
    setPrevNewPost(newPost);
    if (newPost) {
      setPosts((prev) => {
        if (prev.some(p => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    }
  }

  React.useEffect(() => {
    let mounted = true;
    
    // We don't have a getSectionPosts by ID in the service, only by slug,
    // but the backend `getFeed` actually supports section_id now if we pass it.
    // Wait, let's update postService.getFeed to accept sectionId.
    // Actually, I can just update the frontend postService to take section_id!
    // But earlier I just added community_id to `getFeed`. I need to add section_id to `getFeed` in postService.ts.
    postService.getFeed(0, 50, communityId, sectionId)
      .then((data) => {
        if (mounted) setPosts(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [communityId, sectionId]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner size="lg" /></div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Could not load the feed. Please try again later."
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="No posts yet"
        description="Be the first to share something!"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
          onUpdate={(updated) =>
            setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
        />
      ))}
    </div>
  );
}
