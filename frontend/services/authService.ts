import api from "@/lib/axios";
import type { TokenPair, User } from "@/types";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<TokenPair> {
    // OAuth2 form encoding
    const form = new URLSearchParams();
    form.append("username", payload.username);
    form.append("password", payload.password);

    const { data } = await api.post<TokenPair>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },

  async register(payload: RegisterPayload): Promise<TokenPair> {
    const { data } = await api.post<TokenPair>("/auth/register", payload);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const { data } = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(payload: { token: string; new_password: string }): Promise<{ message: string }> {
    const { data } = await api.post("/auth/reset-password", payload);
    return data;
  },
};
