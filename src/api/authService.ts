import { invoke } from "@tauri-apps/api/core";

export type AuthUser = {
  id: number;
  username: string;
  display_name: string;
};

export type RegisterRequest = {
  username: string;
  display_name: string;
  password: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export const AuthService = {
  async hasUsers(): Promise<boolean> {
    return await invoke("auth_has_users");
  },

  async register(payload: RegisterRequest): Promise<AuthUser> {
    return await invoke("auth_register", { req: payload });
  },

  async login(payload: LoginRequest): Promise<AuthUser> {
    return await invoke("auth_login", { req: payload });
  },
};
