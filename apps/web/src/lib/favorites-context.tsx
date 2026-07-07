'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { addFavorite, removeFavorite, listFavoriteIds } from './client-api';
import { getToken } from './session';
import { useAuth } from './auth-context';

interface FavoritesState {
  ready: boolean;
  isFavorite: (productId: string) => boolean;
  /** Alterna un favorito (optimista). Devuelve false si no hay sesión. */
  toggle: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

/**
 * Guarda los ids de favoritos una sola vez por sesión, para que el corazón de
 * cada tarjeta no dispare su propia llamada. Optimista al alternar.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setIds(new Set());
      setReady(true);
      return;
    }
    try {
      const list = await listFavoriteIds();
      setIds(new Set(list));
    } catch {
      setIds(new Set());
    } finally {
      setReady(true);
    }
  }, []);

  // Recarga al iniciar/cerrar sesión.
  useEffect(() => {
    if (authReady) void refresh();
  }, [authReady, user, refresh]);

  const isFavorite = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!getToken()) return false;
      const wasFav = ids.has(productId);
      // Optimista: refleja el cambio de inmediato y revierte si falla.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (wasFav) await removeFavorite(productId);
        else await addFavorite(productId);
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }
      return true;
    },
    [ids],
  );

  return (
    <FavoritesContext.Provider value={{ ready, isFavorite, toggle, refresh }}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}
