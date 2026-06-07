"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ReactionBar } from "./ReactionBar";

export interface PostCardProps {
  post: Post;
  className?: string;
}

export function PostCard({ post, className }: PostCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/post/${post.id}`)}
      className={cn(
        "block rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="flex gap-4">
        <Link href={`/profile/${post.author.username}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Avatar src={post.author.avatar_url} alt={post.author.username} />
        </Link>
        
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
              {post.author.display_name || post.author.username}
              <span className="ml-2 font-normal text-muted-foreground">@{post.author.username}</span>
            </Link>
            <TimeAgo date={post.created_at} />
          </div>
          
          <MarkdownRenderer content={post.content} className="text-foreground" />
          
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border">
              <img src={post.image_urls[0]} alt="Post attachment" className="w-full object-cover max-h-96" />
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <ReactionBar postId={post.id} initialReactions={post.reactions} />
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">{post.comment_count > 0 ? post.comment_count : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
