'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as api from './client-api';
import { clearSession, getStoredUser, saveSession } from './session';
import { getGuestCart, clearGuestCart } from './guest-cart';
import type { AuthUserInfo } from './types';

/** Traspasa la cesta de invitado (localStorage) a la del servidor tras entrar. */
async function mergeGuestCart(): Promise<void> {
  const items = getGuestCart();
  for (const it of items) {
    try {
      await api.addToCart(it.variantId, it.quantity);
    } catch {
      // si una variante ya no está disponible, la ignoramos
    }
  }
  clearGuestCart();
}

interface AuthState {
  user: AuthUserInfo | null;
  ready: boolean; // ya se hidrató desde localStorage
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    saveSession(res.accessToken, res.user);
    await mergeGuestCart();
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    await api.register(email, password, fullName);
    // Registro y login inmediato (el backend no exige confirmar para entrar).
    const res = await api.login(email, password);
    saveSession(res.accessToken, res.user);
    await mergeGuestCart();
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
