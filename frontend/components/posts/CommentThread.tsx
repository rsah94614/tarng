"use client";

import * as React from "react";
import type { CommentThread as ThreadType, Comment } from "@/types";
import { CommentCard } from "./CommentCard";
import { ReplyForm } from "./ReplyForm";

export interface CommentThreadProps {
  postId: number;
  thread: ThreadType;
  onReplyAdded?: (newReply: Comment) => void;
}

export function CommentThread({ postId, thread, onReplyAdded }: CommentThreadProps) {
  const [replies, setReplies] = React.useState<Comment[]>(thread.replies || []);
  const [isReplying, setIsReplying] = React.useState(false);

  const handleReplySuccess = (newReply: Comment) => {
    setReplies((prev) => [...prev, newReply]);
    setIsReplying(false);
    onReplyAdded?.(newReply);
  };

  return (
    <div className="flex flex-col gap-3">
      <CommentCard
        comment={thread.comment}
        onReplyClick={() => setIsReplying(!isReplying)}
      />

      <div className="ml-8 flex flex-col gap-4 border-l-2 border-border pl-4">
        {replies.map((reply) => (
          <CommentCard key={reply.id} comment={reply} />
        ))}
        
        {isReplying && (
          <div className="mt-2">
            <ReplyForm
              postId={postId}
              parentId={thread.comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setIsReplying(false)}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
