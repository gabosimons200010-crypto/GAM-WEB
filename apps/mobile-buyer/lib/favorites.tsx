import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { addFavorite, listFavoriteIds, removeFavorite } from './api';
import { useAuth } from './auth';

interface FavoritesState {
  ids: Set<string>;
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string) => void;
  loggedIn: boolean;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());

  // Carga los ids favoritos al iniciar sesión; limpia al cerrar.
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setIds(new Set());
      return;
    }
    listFavoriteIds()
      .then((list) => setIds(new Set(list)))
      .catch(() => setIds(new Set()));
  }, [ready, user]);

  const isFavorite = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    (productId: string) => {
      if (!user || inFlight.current.has(productId)) return;
      const wasFav = ids.has(productId);
      // Optimista: cambia la UI ya y revierte si falla.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(productId);
        else next.add(productId);
        return next;
      });
      inFlight.current.add(productId);
      const op = wasFav ? removeFavorite(productId) : addFavorite(productId);
      op.catch(() => {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }).finally(() => inFlight.current.delete(productId));
    },
    [ids, user],
  );

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite, toggle, loggedIn: !!user }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}
