"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ReactionBar } from "./ReactionBar";
import type { Comment } from "@/types";

export interface CommentCardProps {
  comment: Comment;
  onReplyClick?: () => void;
}

export function CommentCard({ comment, onReplyClick }: CommentCardProps) {
  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.author.username}`} className="shrink-0 mt-1">
        <Avatar src={comment.author.avatar_url} alt={comment.author.username} size="sm" />
      </Link>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${comment.author.username}`} className="font-semibold text-sm hover:underline">
            {comment.author.display_name || comment.author.username}
          </Link>
          <span className="text-sm text-muted-foreground">@{comment.author.username}</span>
          <TimeAgo date={comment.created_at} className="text-muted-foreground" />
        </div>

        <MarkdownRenderer content={comment.content} className="text-sm" />

        <div className="flex items-center gap-4 mt-2 pt-1">
          <ReactionBar postId={comment.id} initialReactions={comment.reactions} />
          {onReplyClick && (
            <button
              onClick={onReplyClick}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
