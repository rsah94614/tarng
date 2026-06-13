import api from "@/lib/axios";
import type { Post } from "@/types";

export interface Section {
  id: number;
  community_id: number;
  section_type: "feed" | "discussion" | "members" | "about" | "announcements" | "resources" | "custom";
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  position: number;
  is_default: boolean;
  is_visible: boolean;
}

export interface SectionCreatePayload {
  name: string;
  section_type?: string;
  description?: string;
  icon?: string;
}

export interface SectionUpdatePayload {
  name?: string;
  description?: string;
  icon?: string;
  is_visible?: boolean;
}

export interface CommunityBrief {
  id: number;
  name: string;
  slug: string;
  depth: number;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_public: boolean;
  created_by_id: number | null;
  parent_id: number | null;
  depth: number;
  path: string;
  template_id: number | null;
  is_archived: boolean;
  member_count: number;
  children_count: number;
  sections: Section[];
  created_at: string;
}

export interface CommunityMember {
  user_id: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "moderator" | "member";
  joined_at: string;
}

export interface CommunityCreatePayload {
  name: string;
  description?: string;
  is_public?: boolean;
  parent_id?: number;
  template_id?: number;
}

export interface CommunityUpdatePayload {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface Template {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_system: boolean;
  created_at: string;
}

export const communityService = {
  // --- Templates ---
  async listTemplates(): Promise<Template[]> {
    const { data } = await api.get<Template[]>("/communities/templates");
    return data;
  },

  // --- Communities ---
  async listCommunities(skip = 0, limit = 20): Promise<Community[]> {
    const { data } = await api.get<Community[]>("/communities", { params: { skip, limit } });
    return data;
  },

  async createCommunity(payload: CommunityCreatePayload): Promise<Community> {
    const { data } = await api.post<Community>("/communities", payload);
    return data;
  },

  async updateCommunity(slug: string, payload: CommunityUpdatePayload): Promise<Community> {
    const { data } = await api.put<Community>(`/communities/${slug}`, payload);
    return data;
  },

  async deleteCommunity(slug: string): Promise<void> {
    await api.delete(`/communities/${slug}`);
  },

  async getCommunity(slug: string): Promise<Community> {
    const { data } = await api.get<Community>(`/communities/${slug}`);
    return data;
  },

  // --- Nesting ---
  async getChildren(slug: string): Promise<Community[]> {
    const { data } = await api.get<Community[]>(`/communities/${slug}/children`);
    return data;
  },

  async getAncestors(slug: string): Promise<CommunityBrief[]> {
    const { data } = await api.get<CommunityBrief[]>(`/communities/${slug}/ancestors`);
    return data;
  },

  // --- Membership ---
  async joinCommunity(slug: string): Promise<{ joined: boolean; slug: string }> {
    const { data } = await api.post<{ joined: boolean; slug: string }>(`/communities/${slug}/join`);
    return data;
  },

  async leaveCommunity(slug: string): Promise<{ left: boolean }> {
    const { data } = await api.delete<{ left: boolean }>(`/communities/${slug}/leave`);
    return data;
  },

  async getMembers(slug: string): Promise<CommunityMember[]> {
    const { data } = await api.get<CommunityMember[]>(`/communities/${slug}/members`);
    return data;
  },

  async updateMemberRole(slug: string, userId: number, role: string): Promise<CommunityMember> {
    const { data } = await api.put<CommunityMember>(`/communities/${slug}/members/${userId}/role`, { role });
    return data;
  },

  async removeMember(slug: string, userId: number): Promise<void> {
    await api.delete(`/communities/${slug}/members/${userId}`);
  },

  // --- Sections ---
  async getSections(slug: string): Promise<Section[]> {
    const { data } = await api.get<Section[]>(`/communities/${slug}/sections`);
    return data;
  },

  async createSection(slug: string, payload: SectionCreatePayload): Promise<Section> {
    const { data } = await api.post<Section>(`/communities/${slug}/sections`, payload);
    return data;
  },

  async updateSection(slug: string, sectionSlug: string, payload: SectionUpdatePayload): Promise<Section> {
    const { data } = await api.put<Section>(`/communities/${slug}/sections/${sectionSlug}`, payload);
    return data;
  },

  async deleteSection(slug: string, sectionSlug: string): Promise<void> {
    await api.delete(`/communities/${slug}/sections/${sectionSlug}`);
  },

  async reorderSections(slug: string, sectionIds: number[]): Promise<Section[]> {
    const { data } = await api.put<Section[]>(`/communities/${slug}/sections/reorder`, { section_ids: sectionIds });
    return data;
  },

  // --- Posts ---
  async getSectionPosts(slug: string, sectionSlug: string, skip = 0, limit = 20): Promise<Post[]> {
    const { data } = await api.get<Post[]>(`/communities/${slug}/sections/${sectionSlug}/posts`, { params: { skip, limit } });
    return data;
  },

  // Legacy for backward compatibility
  async getCommunityPosts(slug: string, skip = 0, limit = 20): Promise<Post[]> {
    const { data } = await api.get<Post[]>(`/communities/${slug}/posts`, { params: { skip, limit } });
    return data;
  },
};
