import api from "@/lib/axios";
import type { Post, Comment, ReactionType, ReactionSummary } from "@/types";

export interface PostCreatePayload {
  content: string;
  content_type?: "text" | "markdown";
  community_id?: number;
  image_urls?: string[];
}

export interface CommentCreatePayload {
  content: string;
  content_type?: "text" | "markdown";
  parent_id?: number; // for replies
}

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}

export const postService = {
  async getFeed(skip = 0, limit = 20, community_id?: number): Promise<Post[]> {
    const params: { skip: number; limit: number; community_id?: number } = { skip, limit };
    if (community_id) params.community_id = community_id;
    const { data } = await api.get<Post[]>("/posts", { params });
    return data;
  },

  async createPost(payload: PostCreatePayload): Promise<Post> {
    const { data } = await api.post<Post>("/posts", payload);
    return data;
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ url: string }>("/posts/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  },

  async getPost(postId: number): Promise<Post> {
    const { data } = await api.get<Post>(`/posts/${postId}`);
    return data;
  },

  async deletePost(postId: number): Promise<void> {
    await api.delete(`/posts/${postId}`);
  },

  async getComments(postId: number): Promise<CommentThread[]> {
    const { data } = await api.get<CommentThread[]>(`/posts/${postId}/comments`);
    return data;
  },

  async createComment(postId: number, payload: CommentCreatePayload): Promise<Comment> {
    const { data } = await api.post<Comment>(`/posts/${postId}/comments`, payload);
    return data;
  },

  async toggleReaction(postId: number, reactionType: ReactionType): Promise<ReactionSummary> {
    const { data } = await api.post<ReactionSummary>(`/posts/${postId}/reactions`, {
      reaction_type: reactionType,
    });
    return data;
  },
};
