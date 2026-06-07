import api from "@/lib/axios";
import type { User } from "@/types";

export interface UserUpdatePayload {
  displayName?: string;
  bio?: string;
  languagePreference?: string;
  interests?: string[];
}

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  async updateProfile(payload: UserUpdatePayload): Promise<User> {
    const { data } = await api.patch<User>("/users/me", {
      display_name: payload.displayName,
      bio: payload.bio,
      language_preference: payload.languagePreference,
      interests: payload.interests,
    });
    return data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<User>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async getProfile(username: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${username}`);
    return data;
  },
};
