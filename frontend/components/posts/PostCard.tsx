"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, MoreHorizontal, Edit2, Trash2, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ReactionBar } from "./ReactionBar";
import { useAuthStore } from "@/store/useAuthStore";
import { postService } from "@/services/postService";
import { PostComposer } from "./PostComposer";
import { PollCard } from "./PollCard";
import { EventCard } from "./EventCard";

export interface PostCardProps {
  post: Post;
  className?: string;
  onUpdate?: (post: Post) => void;
  onDelete?: (postId: number) => void;
}

export function PostCard({ post, className, onUpdate, onDelete }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const isAuthor = user?.username === post.author.username;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await postService.deletePost(post.id);
      onDelete?.(post.id);
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
    setShowMenu(false);
  };

  if (isEditing) {
    return (
      <div className={cn("block rounded-xl border bg-card shadow-sm", className)}>
        <PostComposer
          communityId={post.community_id || undefined}
          postId={post.id}
          initialContent={post.content}
          onCancel={() => setIsEditing(false)}
          onPostCreated={(updatedPost) => {
            setIsEditing(false);
            onUpdate?.(updatedPost);
          }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/post/${post.id}`)}
      className={cn(
        "block rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="flex gap-4">
        <Link href={`/profile/${post.author.username}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Avatar src={post.author.avatar_url} alt={post.author.username} />
        </Link>
        
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between relative">
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
              {post.author.display_name || post.author.username}
              <span className="ml-2 font-normal text-muted-foreground">@{post.author.username}</span>
            </Link>
            <div className="flex items-center gap-2">
              <TimeAgo date={post.created_at} />
              
              {/* Options Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }} 
                    />
                    <div className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover shadow-md z-20 overflow-hidden text-sm">
                      <button
                        onClick={handleShare}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted text-foreground transition-colors"
                      >
                        <Share className="h-4 w-4" /> Share
                      </button>
                      
                      {isAuthor && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted text-foreground transition-colors"
                          >
                            <Edit2 className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              handleDelete(e);
                              setShowMenu(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <MarkdownRenderer content={post.content} className="text-foreground" />
          
          {post.poll && (
            <PollCard 
              postId={post.id} 
              poll={post.poll} 
              onVote={onUpdate || (() => {})} 
            />
          )}

          {post.event && (
            <EventCard 
              postId={post.id} 
              event={post.event} 
              onRSVP={onUpdate || (() => {})} 
            />
          )}
          
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
