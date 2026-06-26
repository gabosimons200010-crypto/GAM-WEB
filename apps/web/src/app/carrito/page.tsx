import Link from 'next/link';

export const metadata = { title: 'Carrito — GAMARRA GO' };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <p className="text-4xl">🛒</p>
      <h1 className="mt-3 text-xl font-bold">Tu carrito</h1>
      <p className="mt-2 text-sm text-gray-600">
        El carrito con sesión, checkout y pago llega en el próximo sprint del frontend. El backend ya soporta todo el
        flujo (carrito → checkout → pago Yape).
      </p>
      <Link
        href="/buscar"
        className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
      >
        Seguir comprando
      </Link>
    </div>
  );
}
