import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="mt-3 text-xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-sm text-gray-600">El producto o la tienda que buscas no existe o ya no está disponible.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
