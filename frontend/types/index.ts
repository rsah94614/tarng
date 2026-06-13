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

export interface PollOption {
  id: number;
  poll_id: number;
  text: string;
  position: number;
  votes_count: number;
  has_voted: boolean;
}

export interface Poll {
  id: number;
  post_id: number;
  expires_at: string | null;
  options: PollOption[];
  total_votes: number;
  has_voted: boolean;
}

export interface Event {
  id: number;
  post_id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_online: boolean;
  url: string | null;
  going_count: number;
  maybe_count: number;
  user_rsvp: "going" | "maybe" | "not_going" | null;
}

export interface Post {
  id: number;
  content: string;
  content_type: string;
  image_urls: string[] | null;
  author_id: number;
  community_id: number | null;
  section_id: number | null;
  parent_id: number | null;
  post_metadata: Record<string, any> | null;
  poll?: Poll | null;
  event?: Event | null;
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
