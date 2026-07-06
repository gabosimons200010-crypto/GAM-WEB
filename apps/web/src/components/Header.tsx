'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SearchBar } from './SearchBar';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

/** Cabecera del marketplace: logotipo, buscador, carrito, sesión y menú móvil. */
export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();

  // Gate de montaje: server y primer render del cliente muestran el estado
  // deslogueado (no hay localStorage en el server), evitando el error de hidratación.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const authed = mounted && !!user;

  const [open, setOpen] = useState(false);
  // Cierra el menú móvil al navegar.
  useEffect(() => setOpen(false), [pathname]);

  const links = (
    <>
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
          <Link href="/favoritos" className="hover:underline hover:underline-offset-4">
            Favoritos
          </Link>
          <Link href="/mis-ordenes" className="hover:underline hover:underline-offset-4">
            Mis pedidos
          </Link>
          <button onClick={logout} className="microcaps text-left text-muted hover:text-ink" title="Cerrar sesión">
            Salir
          </button>
        </>
      ) : (
        <>
          <Link href="/ingresar" className="hover:underline hover:underline-offset-4">
            Ingresar
          </Link>
          <Link href="/registrarse" className="bg-ink px-3 py-1.5 text-center text-paper transition hover:opacity-80">
            Crear cuenta
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
        <Link href="/" className="shrink-0 font-display text-3xl font-medium tracking-tight text-ink">
          Emporio
        </Link>

        {/* Buscador (desktop) */}
        <div className="hidden flex-1 sm:block sm:px-10">
          <SearchBar />
        </div>

        {/* Nav (desktop) */}
        <nav className="microcaps hidden shrink-0 items-center gap-6 text-ink sm:flex">{links}</nav>

        {/* Hamburguesa (móvil) */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex h-9 w-9 items-center justify-center border border-line text-ink sm:hidden"
          aria-label="Menú"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* Menú desplegable (móvil) */}
      {open && (
        <div className="border-t border-line px-4 py-4 sm:hidden">
          <SearchBar />
          <nav className="microcaps mt-5 flex flex-col gap-4 text-ink">{links}</nav>
        </div>
      )}
    </header>
  );
}
