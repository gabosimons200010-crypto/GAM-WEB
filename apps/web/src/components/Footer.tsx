'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export function Footer() {
  const [done, setDone] = useState(false);

  function onNotify(e: FormEvent) {
    e.preventDefault();
    setDone(true); // Captura demo: sin backend de emails todavía.
  }

  return (
    <footer className="mt-20 border-t border-line bg-paper">
      {/* Apartado de vendedor: separado, al pie del sitio. */}
      <div className="border-b border-line">
        <Link
          href="/vender"
          className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-3 px-4 py-8 transition hover:bg-[#fafafa]"
        >
          <span className="font-display text-2xl text-ink sm:text-3xl">¿Tienes una marca? Vende en Emporio</span>
          <span className="microcaps border-b border-ink pb-0.5 text-ink">Empezar a vender →</span>
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <p className="microcaps mb-4 text-ink">Newsletter</p>
            <form onSubmit={onNotify} className="flex max-w-xs items-baseline gap-3 border-b border-ink pb-1">
              <input
                type="email"
                required
                disabled={done}
                placeholder="INTRODUCIR E-MAIL"
                className="microcaps w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
              />
              <button type="submit" disabled={done} className="microcaps shrink-0 hover:underline hover:underline-offset-4">
                {done ? 'Suscrito' : 'Suscribirme'}
              </button>
            </form>
          </div>
          <div className="microcaps space-y-3 text-muted">
            <p className="text-ink">Ayuda</p>
            <Link href="/envios" className="block w-fit hover:text-ink">
              Envíos y devoluciones
            </Link>
            <Link href="/guia-de-tallas" className="block w-fit hover:text-ink">
              Guía de tallas
            </Link>
            <Link href="/contacto" className="block w-fit hover:text-ink">
              Contacto
            </Link>
          </div>
          <div className="microcaps space-y-3 text-muted">
            <p className="text-ink">La empresa</p>
            <Link href="/vender" className="block w-fit hover:text-ink">
              Vender en Emporio
            </Link>
            <Link href="/marcas" className="block w-fit hover:text-ink">
              Marcas
            </Link>
            <p>Perú</p>
          </div>
        </div>

        <div className="microcaps mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-muted">
          <span>Emporio — Moda peruana, online</span>
          <span className="flex items-center gap-1">
            © {new Date().getFullYear()} · Demo Fase 2
            {/* Acceso discreto al panel de administración (oculto a la vista habitual). */}
            <Link href="/admin/tiendas" aria-label="Administración" className="text-line transition hover:text-ink">
              ·
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
