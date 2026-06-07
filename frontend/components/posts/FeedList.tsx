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
  newPost?: Post | null;
}

export function FeedList({ communityId, newPost }: FeedListProps) {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [prevCommunityId, setPrevCommunityId] = React.useState(communityId);
  if (communityId !== prevCommunityId) {
    setPrevCommunityId(communityId);
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
    
    postService.getFeed(0, 50, communityId)
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
  }, [communityId]);

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
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
