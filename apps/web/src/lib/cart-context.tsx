'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as api from './client-api';
import { getToken } from './session';
import { guestCount, GUEST_CART_EVENT } from './guest-cart';
import { useAuth } from './auth-context';

interface CartState {
  count: number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

/** Mantiene el número de ítems de la cesta (servidor si hay sesión, o invitado). */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (getToken()) {
      try {
        const cart = await api.getCart();
        setCount(cart.itemCount);
      } catch {
        setCount(0);
      }
    } else {
      setCount(guestCount());
    }
  }, []);

  // Recalcula al iniciar sesión / cerrar sesión.
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, user, refresh]);

  // Reacciona a cambios de la cesta de invitado (agregar/quitar sin sesión).
  useEffect(() => {
    const handler = () => {
      if (!getToken()) setCount(guestCount());
    };
    window.addEventListener(GUEST_CART_EVENT, handler);
    return () => window.removeEventListener(GUEST_CART_EVENT, handler);
  }, []);

  return <CartContext.Provider value={{ count, refresh }}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
