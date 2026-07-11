import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getCart } from './api';
import { useAuth } from './auth';

interface CartState {
  count: number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      const cart = await getCart();
      setCount(cart.itemCount);
    } catch {
      // Silencioso: el badge no debe romper la app.
    }
  }, [user]);

  // Sincroniza el conteo al iniciar sesión / cerrar sesión.
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);

  return <CartContext.Provider value={{ count, refresh }}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
