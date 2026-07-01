'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as api from './client-api';
import { getToken } from './session';
import { useAuth } from './auth-context';

interface CartState {
  count: number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

/** Mantiene el número de ítems del carrito para el badge del header. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setCount(0);
      return;
    }
    try {
      const cart = await api.getCart();
      setCount(cart.itemCount);
    } catch {
      setCount(0);
    }
  }, []);

  // Recalcula al iniciar sesión / cerrar sesión.
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, user, refresh]);

  return <CartContext.Provider value={{ count, refresh }}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
