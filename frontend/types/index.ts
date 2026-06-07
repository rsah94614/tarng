export interface User {
  id: number;
  username: string;
  email?: string; // only if me
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  language_preference: string;
  interests: string[] | null;
  created_at: string;
}

export type ReactionType = "like" | "insightful" | "helpful";

export interface ReactionSummary {
  like: number;
  insightful: number;
  helpful: number;
  user_reaction: ReactionType | null;
}

export interface Post {
  id: number;
  content: string;
  content_type: string;
  image_urls: string[] | null;
  author_id: number;
  community_id: number | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  author: User;
  reactions: ReactionSummary;
  comment_count: number;
}

export type Comment = Post;

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}

export interface Notification {
  id: number;
  notification_type: string;
  message: string;
  is_read: boolean;
  actor_id: number | null;
  actor_username: string | null;
  actor_avatar_url: string | null;
  post_id: number | null;
  community_id: number | null;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}
