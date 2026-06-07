"use client";

import * as React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar } from "@/components/ui/Avatar";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Spinner } from "@/components/ui/Spinner";
import { postService } from "@/services/postService";
import type { Post } from "@/types";
import { ImageIcon } from "lucide-react";

export interface PostComposerProps {
  communityId?: number;
  onPostCreated?: (post: Post) => void;
}

export function PostComposer({ communityId, onPostCreated }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [showImageUpload, setShowImageUpload] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    
    setLoading(true);
    try {
      const imageUrls: string[] = [];
      if (imageFile) {
        const url = await postService.uploadImage(imageFile);
        imageUrls.push(url);
      }

      const newPost = await postService.createPost({
        content,
        community_id: communityId,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      setContent("");
      setImageFile(null);
      setShowImageUpload(false);
      onPostCreated?.(newPost);
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        <Avatar src={user.avatar_url} alt={user.username} className="shrink-0" />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full resize-none border-0 bg-transparent text-lg focus:ring-0 placeholder:text-muted-foreground outline-none min-h-[80px]"
              placeholder="What's happening?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                // Auto-resize
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />

            {showImageUpload && (
              <div className="mt-2 mb-4 h-48 max-w-sm">
                <ImageUpload value={imageFile} onChange={setImageFile} className="h-full" />
              </div>
            )}

            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || (!content.trim() && !imageFile)}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Spinner size="sm" className="mr-2" /> : null}
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
