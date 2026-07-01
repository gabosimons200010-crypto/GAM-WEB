'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { getCart, updateCartItem, removeCartItem, ClientApiError } from '@/lib/client-api';
import type { CartView } from '@/lib/types';
import { money } from '@/lib/format';

export default function CartPage() {
  const { user, ready } = useAuth();
  const { refresh } = useCart();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyVariant, setBusyVariant] = useState<string | null>(null);

  async function reload() {
    try {
      const c = await getCart();
      setCart(c);
      await refresh();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar el carrito');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function changeQty(variantId: string, quantity: number) {
    setBusyVariant(variantId);
    try {
      const c = quantity <= 0 ? await removeCartItem(variantId) : await updateCartItem(variantId, quantity);
      setCart(c);
      await refresh();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No se pudo actualizar');
    } finally {
      setBusyVariant(null);
    }
  }

  if (ready && !user) {
    return (
      <Panel>
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-xl font-bold">Inicia sesión para ver tu carrito</h1>
        <Link href="/ingresar?next=/carrito" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Ingresar
        </Link>
      </Panel>
    );
  }

  if (loading) return <Panel><p className="text-gray-500">Cargando carrito…</p></Panel>;

  if (error) return <Panel><p className="text-red-600">{error}</p></Panel>;

  if (!cart || cart.groups.length === 0) {
    return (
      <Panel>
        <p className="text-4xl">🛒</p>
        <h1 className="mt-3 text-xl font-bold">Tu carrito está vacío</h1>
        <Link href="/buscar" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Explorar catálogo
        </Link>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tu carrito</h1>
        {cart.groups.map((g) => (
          <div key={g.storeId} className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <Link href={`/tienda/${g.storeSlug}`} className="text-sm font-semibold text-gray-700 hover:text-brand-600">
                🏬 {g.storeName}
              </Link>
              <span className="text-sm text-gray-500">{money(g.subtotal)}</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {g.lines.map((l) => (
                <li key={l.variantId} className="flex gap-3 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {l.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.thumbnailUrl} alt={l.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">👕</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/producto/${l.productSlug}`} className="text-sm font-medium text-gray-800 hover:text-brand-600">
                      {l.productName}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {[l.size, l.color].filter(Boolean).join(' · ')} · {money(l.unitPrice)} c/u
                    </p>
                    {l.unavailable && (
                      <p className="mt-1 text-xs font-medium text-red-500">Sin stock o no disponible — no se cobrará.</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <QtyButton disabled={busyVariant === l.variantId} onClick={() => changeQty(l.variantId, l.quantity - 1)}>
                        −
                      </QtyButton>
                      <span className="w-8 text-center text-sm">{l.quantity}</span>
                      <QtyButton
                        disabled={busyVariant === l.variantId || l.quantity >= l.available}
                        onClick={() => changeQty(l.variantId, l.quantity + 1)}
                      >
                        +
                      </QtyButton>
                      <button
                        onClick={() => changeQty(l.variantId, 0)}
                        disabled={busyVariant === l.variantId}
                        className="ml-3 text-xs text-gray-400 hover:text-red-500"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">{money(l.lineTotal)}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Resumen</h2>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Productos ({cart.itemCount})</span>
          <span>{money(cart.total)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 text-base font-bold">
          <span>Total</span>
          <span>{money(cart.total)}</span>
        </div>
        <Link
          href="/checkout"
          className={`mt-5 block rounded-lg px-4 py-3 text-center text-sm font-bold text-white ${
            cart.total > 0 ? 'bg-brand-500 hover:bg-brand-600' : 'pointer-events-none bg-gray-300'
          }`}
        >
          Ir a pagar
        </Link>
      </aside>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center">{children}</div>;
}

function QtyButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:border-brand-400 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
