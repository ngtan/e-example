// src/lib/types/auth.ts
export interface AuthManager {
  getToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
  clearTokens(): void;
}

