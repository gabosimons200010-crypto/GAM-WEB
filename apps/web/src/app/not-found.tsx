import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="font-display text-7xl text-ink">404</p>
      <h1 className="mt-4 font-display text-2xl text-ink">No encontramos esta página</h1>
      <p className="microcaps mt-3 text-muted">El producto o la tienda que buscas no existe o ya no está disponible.</p>
      <Link href="/" className="microcaps mt-10 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
        Volver al inicio
      </Link>
    </div>
  );
}
