import Link from 'next/link';
import type { Metadata } from 'next';
import { BRANDS } from '@/lib/brands';

export const metadata: Metadata = {
  title: 'Marcas — GAMARRA GO',
  description: 'Las marcas independientes que venden a través del marketplace.',
};

export default function BrandsPage() {
  return (
    <div>
      <div className="border-b border-line pb-10 pt-6 text-center">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">Marcas</h1>
        <p className="microcaps mt-4 text-muted">
          {BRANDS.length} marcas independientes · cada una maneja su perfil, sus cápsulas y su stock
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-3 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((b) => (
          <Link key={b.slug} href={`/tienda/${b.slug}`} className="group flex flex-col">
            {/* Tile editorial: foto de campaña, o tile tipográfico si no hay foto. */}
            <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f4f4]">
              {b.editorialUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.editorialUrl}
                  alt={`Editorial de ${b.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-display text-4xl text-line">{b.name}</span>
                </div>
              )}
              {/* Logo sobre la foto: imagen si existe, logotipo en serif si no. */}
              <div
                className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 ${
                  b.editorialUrl ? 'bg-gradient-to-t from-black/45 to-transparent' : ''
                }`}
              >
                {b.logoUrl ? (
                  <span className="bg-paper/90 px-2.5 py-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.logoUrl} alt={b.name} className="max-h-7 max-w-36 object-contain" />
                  </span>
                ) : (
                  <span className={`font-display text-2xl ${b.editorialUrl ? 'text-paper' : 'text-ink'}`}>{b.name}</span>
                )}
                {b.instagram && (
                  <span className={`microcaps text-[10px] ${b.editorialUrl ? 'text-paper/80' : 'text-muted'}`}>
                    {b.instagram}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 pt-4">
              <p className="text-[13px] leading-relaxed text-ink">{b.bio}</p>
              <span className="microcaps mt-auto w-fit border-b border-ink pb-0.5 text-ink group-hover:opacity-70">
                Ver catálogo
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
