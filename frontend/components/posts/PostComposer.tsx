"use client";

import * as React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar } from "@/components/ui/Avatar";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Spinner } from "@/components/ui/Spinner";
import { postService } from "@/services/postService";
import type { Post } from "@/types";
import { ImageIcon, BarChart2, CalendarDays, X, Plus } from "lucide-react";

export interface PostComposerProps {
  communityId?: number;
  sectionId?: number;
  onPostCreated?: (post: Post) => void;
  onCancel?: () => void;
  draftKey?: string;
  initialContent?: string;
  postId?: number;
  placeholder?: string;
}

export function PostComposer({ communityId, sectionId, onPostCreated, onCancel, draftKey, initialContent, postId, placeholder }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = React.useState(initialContent || "");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [showImageUpload, setShowImageUpload] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  const [postType, setPostType] = React.useState<"text" | "poll" | "event">("text");
  
  // Poll state
  const [pollOptions, setPollOptions] = React.useState(["", ""]);
  
  // Event state
  const [eventTitle, setEventTitle] = React.useState("");
  const [eventStart, setEventStart] = React.useState("");
  const [eventEnd, setEventEnd] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");

  const resolvedDraftKey = draftKey || `postDraft_${communityId || 'home'}_${sectionId || 'main'}`;

  // Load draft on mount
  React.useEffect(() => {
    if (!initialContent) {
      const savedDraft = localStorage.getItem(resolvedDraftKey);
      if (savedDraft) {
        setContent(savedDraft);
      }
    }
  }, [resolvedDraftKey, initialContent]);

  // Save draft on change
  React.useEffect(() => {
    if (!initialContent) {
      if (content) {
        localStorage.setItem(resolvedDraftKey, content);
      } else {
        localStorage.removeItem(resolvedDraftKey);
      }
    }
  }, [content, resolvedDraftKey, initialContent]);

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

      let resultPost: Post;
      
      const basePayload = {
        content,
        community_id: communityId,
        section_id: sectionId,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      if (postId) {
        resultPost = await postService.updatePost(postId, basePayload);
      } else {
        const createPayload: any = { ...basePayload };
        
        if (postType === "poll") {
          const validOptions = pollOptions.filter(o => o.trim().length > 0);
          if (validOptions.length >= 2) {
            createPayload.poll = { options: validOptions.map((o, i) => ({ text: o.trim(), position: i })) };
          }
        } else if (postType === "event") {
          if (eventTitle && eventStart && eventEnd) {
            createPayload.event = {
              title: eventTitle,
              start_time: new Date(eventStart).toISOString(),
              end_time: new Date(eventEnd).toISOString(),
              location: eventLocation || undefined,
            };
          }
        }
        
        resultPost = await postService.createPost(createPayload);
      }

      setContent("");
      setImageFile(null);
      setShowImageUpload(false);
      setPostType("text");
      setPollOptions(["", ""]);
      setEventTitle("");
      setEventStart("");
      setEventEnd("");
      setEventLocation("");
      if (!initialContent) {
        localStorage.removeItem(resolvedDraftKey);
      }
      onPostCreated?.(resultPost);
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
              placeholder={placeholder || "What's happening?"}
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

            {postType === "poll" && !postId && (
              <div className="mt-4 mb-4 space-y-2 border rounded-lg p-4 bg-muted/30">
                <div className="text-sm font-medium mb-3">Poll Options</div>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-sm text-primary font-medium flex items-center gap-1 mt-2 hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add Option
                  </button>
                )}
              </div>
            )}

            {postType === "event" && !postId && (
              <div className="mt-4 mb-4 space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="text-sm font-medium">Event Details</div>
                <input
                  type="text"
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Event Title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Location (optional)"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>
            )}

            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setPostType("text"); setShowImageUpload(!showImageUpload); }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${showImageUpload ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                  title="Add Image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                {!postId && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setPostType(postType === "poll" ? "text" : "poll"); setShowImageUpload(false); }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${postType === "poll" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                      title="Create Poll"
                    >
                      <BarChart2 className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPostType(postType === "event" ? "text" : "event"); setShowImageUpload(false); }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${postType === "event" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                      title="Create Event"
                    >
                      <CalendarDays className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      setContent("");
                      setImageFile(null);
                      if (!initialContent) {
                        localStorage.removeItem(resolvedDraftKey);
                      }
                      onCancel();
                    }}
                    className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || (!content.trim() && !imageFile)}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Spinner size="sm" className="mr-2" /> : null}
                  {initialContent ? "Save" : "Post"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
