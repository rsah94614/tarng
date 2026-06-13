"use client";

import * as React from "react";
import { useInView } from "react-intersection-observer";
import { postService } from "@/services/postService";
import type { Post } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Image as ImageIcon } from "lucide-react";

interface GallerySectionProps {
  communityId: number;
  sectionId: number;
}

export function GallerySection({ communityId, sectionId }: GallerySectionProps) {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const { ref, inView } = useInView();

  const loadPosts = async () => {
    try {
      const newPosts = await postService.getFeed(page * 20, 20, communityId, sectionId);
      // Only keep posts with images
      const imagePosts = newPosts.filter(p => p.image_urls && p.image_urls.length > 0);
      
      setPosts((prev) => (page === 0 ? imagePosts : [...prev, ...imagePosts]));
      setHasMore(newPosts.length === 20);
    } catch (err) {
      console.error("Failed to load gallery", err);
    }
  };

  React.useEffect(() => {
    setPage(0);
  }, [sectionId]);

  React.useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sectionId]);

  React.useEffect(() => {
    if (inView && hasMore) setPage((p) => p + 1);
  }, [inView, hasMore]);

  if (posts.length === 0 && !hasMore) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-xl bg-card">
        <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
        <p>No images in this gallery yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-xl bg-muted border">
            {post.image_urls && (
              <img 
                src={post.image_urls[0]} 
                alt="Gallery item" 
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
              <div className="font-medium text-sm truncate">{post.content || "Image"}</div>
              <div className="text-xs text-white/70">by @{post.author.username}</div>
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div ref={ref} className="py-8 flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
