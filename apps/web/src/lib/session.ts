import type { AuthUserInfo } from './types';

// Persistencia simple de sesión en el navegador (demo). El refresh token vive
// en una cookie HttpOnly que pone el backend; aquí guardamos solo el access
// token para las llamadas del cliente. Vence a los 15 min → re-login.
const TOKEN_KEY = 'gg_token';
const USER_KEY = 'gg_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUserInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserInfo;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUserInfo): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
