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
      setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar la cesta');
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
        <h1 className="font-display text-3xl text-ink">Inicia sesión para ver tu cesta</h1>
        <Link href="/ingresar?next=/carrito" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ingresar
        </Link>
      </Panel>
    );
  }

  if (loading)
    return (
      <Panel>
        <p className="microcaps text-muted">Cargando cesta…</p>
      </Panel>
    );

  if (error)
    return (
      <Panel>
        <p className="microcaps text-sale">{error}</p>
      </Panel>
    );

  if (!cart || cart.groups.length === 0) {
    return (
      <Panel>
        <h1 className="font-display text-3xl text-ink">Tu cesta está vacía</h1>
        <Link href="/buscar" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Ver catálogo
        </Link>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
      <div className="space-y-10">
        <h1 className="border-b border-line pb-3 font-display text-3xl text-ink">Cesta</h1>
        {cart.groups.map((g) => (
          <div key={g.storeId}>
            <div className="flex items-baseline justify-between pb-3">
              <Link href={`/tienda/${g.storeSlug}`} className="microcaps text-ink hover:underline hover:underline-offset-4">
                {g.storeName}
              </Link>
              <span className="microcaps text-muted">{money(g.subtotal)}</span>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {g.lines.map((l) => (
                <li key={l.variantId} className="flex gap-5 py-5">
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#f4f4f4]">
                    {l.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.thumbnailUrl} alt={l.productName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/producto/${l.productSlug}`} className="microcaps text-ink hover:underline hover:underline-offset-4">
                      {l.productName}
                    </Link>
                    <p className="microcaps mt-1 text-[10px] text-muted">
                      {[l.size, l.color].filter(Boolean).join(' · ')} · {money(l.unitPrice)} c/u
                    </p>
                    {l.unavailable && (
                      <p className="microcaps mt-1 text-[10px] text-sale">Sin stock o no disponible — no se cobrará.</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <QtyButton disabled={busyVariant === l.variantId} onClick={() => changeQty(l.variantId, l.quantity - 1)}>
                        −
                      </QtyButton>
                      <span className="w-6 text-center text-[13px] text-ink">{l.quantity}</span>
                      <QtyButton
                        disabled={busyVariant === l.variantId || l.quantity >= l.available}
                        onClick={() => changeQty(l.variantId, l.quantity + 1)}
                      >
                        +
                      </QtyButton>
                      <button
                        onClick={() => changeQty(l.variantId, 0)}
                        disabled={busyVariant === l.variantId}
                        className="microcaps ml-4 text-[10px] text-muted hover:text-ink"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="text-[13px] text-ink">{money(l.lineTotal)}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <aside className="h-fit border-t border-ink pt-5 lg:sticky lg:top-24">
        <h2 className="microcaps text-muted">Resumen</h2>
        <div className="microcaps mt-5 flex items-baseline justify-between text-muted">
          <span>Productos ({cart.itemCount})</span>
          <span>{money(cart.total)}</span>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4 text-[15px] text-ink">
          <span className="microcaps">Total</span>
          <span>{money(cart.total)}</span>
        </div>
        <Link
          href="/checkout"
          className={`microcaps mt-6 block px-4 py-3.5 text-center ${
            cart.total > 0 ? 'bg-ink text-paper hover:opacity-80' : 'pointer-events-none bg-line text-muted'
          }`}
        >
          Tramitar pedido
        </Link>
      </aside>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg py-20 text-center">{children}</div>;
}

function QtyButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center border border-line text-ink hover:border-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}
