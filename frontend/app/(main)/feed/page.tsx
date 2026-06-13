"use client";

import * as React from "react";
import { FeedList } from "@/components/posts/FeedList";
import { PostComposer } from "@/components/posts/PostComposer";
import type { Post } from "@/types";

export default function FeedPage() {
  return (
    <div className="space-y-6 pt-4">
      <div className="px-4 md:px-0 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Home</h1>
      </div>
      <div className="px-4 md:px-0">
        <FeedList />
      </div>
    </div>
  );
}
