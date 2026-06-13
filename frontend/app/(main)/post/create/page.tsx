"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PostComposer } from "@/components/posts/PostComposer";
import { ArrowLeft } from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto pt-6 px-4 md:px-0">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Create Post</h1>
      </div>
      
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-2">
        <PostComposer 
          onPostCreated={() => router.push("/feed")} 
          onCancel={() => router.back()}
          placeholder="What's happening? Share it here."
        />
      </div>
    </div>
  );
}
