'use client';

import Link from 'next/link';
import { SearchBar } from './SearchBar';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

/** Cabecera del marketplace: logo, buscador, carrito y sesión. */
export function Header() {
  const { user, ready, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg bg-brand-500 px-2 py-1 text-lg font-black text-white">GG</span>
          <span className="text-lg font-extrabold tracking-tight">
            GAMARRA <span className="text-brand-600">GO</span>
          </span>
        </Link>

        <div className="flex-1 sm:px-6">
          <SearchBar />
        </div>

        <nav className="flex shrink-0 items-center gap-4 text-sm font-medium text-gray-700">
          <Link href="/buscar" className="hover:text-brand-600">
            Catálogo
          </Link>

          <Link href="/carrito" className="relative flex items-center gap-1 hover:text-brand-600" aria-label="Carrito">
            <span className="text-lg">🛒</span>
            <span className="hidden sm:inline">Carrito</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {ready && user ? (
            <div className="flex items-center gap-3">
              <Link href="/vendedor" className="hover:text-brand-600">
                Vender
              </Link>
              <Link href="/mis-ordenes" className="hover:text-brand-600">
                Mis órdenes
              </Link>
              <button onClick={logout} className="text-gray-500 hover:text-brand-600" title="Cerrar sesión">
                Salir
              </button>
            </div>
          ) : (
            <Link href="/ingresar" className="rounded-lg bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-700">
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
