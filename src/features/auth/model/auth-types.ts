import type { SessionUser } from "@/lib/auth/auth-session";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponsePayload = {
  message: string;
  token: string;
  user: SessionUser;
};

export type ProfileResponsePayload = {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "recepcionista" | "unassigned";
  confirmed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImageUrl?: string | null;
  authProvider?: "local" | "google";
};

