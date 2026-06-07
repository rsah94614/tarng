"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ReactionBar } from "./ReactionBar";
import { ReplyForm } from "./ReplyForm";
import { CommentThread } from "./CommentThread";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { postService } from "@/services/postService";
import type { Post, CommentThread as ThreadType } from "@/types";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface PostDetailProps {
  postId: number;
}

export function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
  const [post, setPost] = React.useState<Post | null>(null);
  const [threads, setThreads] = React.useState<ThreadType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [prevPostId, setPrevPostId] = React.useState(postId);
  if (postId !== prevPostId) {
    setPrevPostId(postId);
    setLoading(true);
    setPost(null);
    setThreads([]);
    setError(false);
  }

  React.useEffect(() => {
    let mounted = true;

    Promise.all([
      postService.getPost(postId),
      postService.getComments(postId),
    ])
      .then(([postData, threadsData]) => {
        if (mounted) {
          setPost(postData);
          setThreads(threadsData);
        }
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [postId]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !post) {
    return (
      <EmptyState
        title="Post not found"
        description="This post may have been deleted or doesn't exist."
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header / Back button */}
      <div className="flex items-center gap-4 py-4 sticky top-0 bg-background/80 backdrop-blur z-10 border-b">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">Post</h2>
      </div>

      {/* Main Post */}
      <div className="p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar src={post.author.avatar_url} alt={post.author.username} size="lg" />
          </Link>
          <div>
            <Link href={`/profile/${post.author.username}`} className="font-bold text-base hover:underline block">
              {post.author.display_name || post.author.username}
            </Link>
            <div className="text-sm text-muted-foreground">
              @{post.author.username} • <TimeAgo date={post.created_at} />
            </div>
          </div>
        </div>

        <div className="text-lg">
          <MarkdownRenderer content={post.content} />
        </div>

        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <img src={post.image_urls[0]} alt="Post attachment" className="w-full object-cover" />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <ReactionBar postId={post.id} initialReactions={post.reactions} />
        </div>
      </div>

      {/* Reply Composer */}
      <div className="p-4 border-b pb-8">
        <ReplyForm
          postId={post.id}
          onSuccess={(newComment) => {
            setThreads((prev) => [{ comment: newComment, replies: [] }, ...prev]);
          }}
        />
      </div>

      {/* Comments section */}
      <div className="space-y-6 px-4">
        {threads.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          threads.map((thread) => (
            <CommentThread key={thread.comment.id} postId={post.id} thread={thread} />
          ))
        )}
      </div>
    </div>
  );
}
