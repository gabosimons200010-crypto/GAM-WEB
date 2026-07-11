import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { login as apiLogin, register as apiRegister, setAccessToken } from './api';
import type { AuthUserInfo } from './types';

const TOKEN_KEY = 'gg_access_token';
const USER_KEY = 'gg_user';

interface AuthState {
  user: AuthUserInfo | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [ready, setReady] = useState(false);

  // Restaura la sesión guardada al abrir la app.
  useEffect(() => {
    (async () => {
      try {
        const [token, rawUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (token && rawUser) {
          setAccessToken(token);
          setUser(JSON.parse(rawUser) as AuthUserInfo);
        }
      } catch {
        // Sesión corrupta o ausente: arranca deslogueado.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function persist(token: string, u: AuthUserInfo) {
    setAccessToken(token);
    setUser(u);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(u)),
    ]);
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    await persist(res.accessToken, res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    await apiRegister(email, password, fullName);
    const res = await apiLogin(email, password); // Auto-inicio de sesión tras registrar.
    await persist(res.accessToken, res.user);
  }, []);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
