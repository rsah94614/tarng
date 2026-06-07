"use client";

import { PostDetail } from "@/components/posts/PostDetail";
import { useParams } from "next/navigation";

export default function PostPage() {
  const params = useParams();
  const postId = Number(params.id);

  if (!postId || isNaN(postId)) {
    return <div className="p-8 text-center text-muted-foreground">Invalid post ID</div>;
  }

  return <PostDetail postId={postId} />;
}
