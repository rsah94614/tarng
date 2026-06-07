"use client";

import * as React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { postService } from "@/services/postService";
import type { Comment } from "@/types";

export interface ReplyFormProps {
  postId: number;
  parentId?: number;
  onSuccess?: (comment: Comment) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ReplyForm({ postId, parentId, onSuccess, onCancel, autoFocus }: ReplyFormProps) {
  const { user } = useAuthStore();
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const newComment = await postService.createComment(postId, {
        content,
        parent_id: parentId,
      });
      setContent("");
      onSuccess?.(newComment);
    } catch (error) {
      console.error("Failed to post reply", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar src={user.avatar_url} alt={user.username} size="sm" className="shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <textarea
          ref={inputRef}
          className="w-full resize-none rounded-xl border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground min-h-[80px]"
          placeholder="Write a reply..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" className="mr-2 h-4 w-4" /> : null}
            Reply
          </button>
        </div>
      </div>
    </form>
  );
}
