import api from "@/lib/axios";

// Assuming we add Community to types/index.ts
export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_public: boolean;
  created_by_id: number | null;
  member_count: number;
  created_at: string;
}

export interface CommunityCreatePayload {
  name: string;
  description?: string;
  is_public?: boolean;
}

export const communityService = {
  async listCommunities(skip = 0, limit = 20): Promise<Community[]> {
    const { data } = await api.get<Community[]>("/communities", { params: { skip, limit } });
    return data;
  },

  async createCommunity(payload: CommunityCreatePayload): Promise<Community> {
    const { data } = await api.post<Community>("/communities", {
      name: payload.name,
      description: payload.description,
      is_public: payload.is_public ?? true,
    });
    return data;
  },

  async getCommunity(slug: string): Promise<Community> {
    const { data } = await api.get<Community>(`/communities/${slug}`);
    return data;
  },

  async joinCommunity(slug: string): Promise<{ joined: boolean; slug: string }> {
    const { data } = await api.post<{ joined: boolean; slug: string }>(`/communities/${slug}/join`);
    return data;
  },

  async leaveCommunity(slug: string): Promise<{ left: boolean }> {
    const { data } = await api.delete<{ left: boolean }>(`/communities/${slug}/leave`);
    return data;
  },
};
