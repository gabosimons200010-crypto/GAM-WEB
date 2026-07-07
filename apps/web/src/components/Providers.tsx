'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { FavoritesProvider } from '@/lib/favorites-context';

/** Envuelve la app con los contextos de sesión, carrito y favoritos (lado cliente). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}
