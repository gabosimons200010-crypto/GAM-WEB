'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SearchBar } from './SearchBar';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

/** Cabecera del marketplace: logotipo, buscador, carrito y sesión. */
export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  // Gate de montaje: el server y el primer render del cliente muestran el estado
  // deslogueado (no hay localStorage en el server), evitando el error de hidratación.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const authed = mounted && !!user;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
        <Link href="/" className="shrink-0 font-display text-3xl font-medium tracking-tight text-ink">
          Emporio
        </Link>

        <div className="flex-1 sm:px-10">
          <SearchBar />
        </div>

        <nav className="microcaps flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 text-ink">
          <Link href="/" className="hover:underline hover:underline-offset-4">
            Inicio
          </Link>
          <Link href="/buscar" className="hover:underline hover:underline-offset-4">
            Catálogo
          </Link>
          <Link href="/marcas" className="hover:underline hover:underline-offset-4">
            Marcas
          </Link>
          <Link href="/carrito" className="hover:underline hover:underline-offset-4" aria-label="Cesta">
            Cesta (<span suppressHydrationWarning>{mounted ? count : 0}</span>)
          </Link>

          {authed ? (
            <>
              <Link href="/mis-ordenes" className="hover:underline hover:underline-offset-4">
                Mis pedidos
              </Link>
              <button onClick={logout} className="microcaps text-muted hover:text-ink" title="Cerrar sesión">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/ingresar" className="hover:underline hover:underline-offset-4">
                Ingresar
              </Link>
              <Link href="/registrarse" className="bg-ink px-3 py-1.5 text-paper transition hover:opacity-80">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
