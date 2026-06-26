import Link from 'next/link';
import { SearchBar } from './SearchBar';

/** Cabecera del marketplace: logo, buscador y accesos. */
export function Header() {
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
          <Link href="/carrito" className="flex items-center gap-1 hover:text-brand-600" aria-label="Carrito">
            🛒 <span className="hidden sm:inline">Carrito</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
