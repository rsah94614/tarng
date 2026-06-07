"use client";

import * as React from "react";
import { FeedList } from "@/components/posts/FeedList";
import { PostComposer } from "@/components/posts/PostComposer";
import type { Post } from "@/types";

export default function FeedPage() {
  const [newPost, setNewPost] = React.useState<Post | null>(null);

  return (
    <div className="space-y-6 pt-4">
      <div className="px-4 md:px-0">
        <h1 className="text-2xl font-bold mb-4">Home</h1>
        <PostComposer onPostCreated={setNewPost} />
      </div>
      <div className="px-4 md:px-0">
        <FeedList newPost={newPost} />
      </div>
    </div>
  );
}
