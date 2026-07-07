'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import {
  checkout,
  createPayment,
  guestCheckout,
  createGuestPayment,
  simulatePaymentConfirmation,
  getCart,
  validateCoupon,
  ClientApiError,
} from '@/lib/client-api';
import type { CouponResult } from '@/lib/client-api';
import { getGuestCart, guestSubtotal, clearGuestCart } from '@/lib/guest-cart';
import type { OrderView, PaymentView, ShippingAddressInput } from '@/lib/types';
import { money } from '@/lib/format';

type Step = 'address' | 'pay' | 'done';

export default function CheckoutPage() {
  const { user, ready } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>('address');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [addr, setAddr] = useState<ShippingAddressInput>({ department: 'Lima', province: 'Lima', district: '', line: '', reference: '', phone: '' });
  const [buyerName, setBuyerName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [subtotal, setSubtotal] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const isGuest = ready && !user;

  // Subtotal: del servidor (con sesión) o de la cesta de invitado (localStorage).
  useEffect(() => {
    if (!ready) return;
    if (user) {
      getCart().then((c) => setSubtotal(c.total)).catch(() => {});
    } else {
      const items = getGuestCart();
      if (items.length === 0) router.replace('/carrito');
      else setSubtotal(guestSubtotal());
    }
  }, [ready, user, router]);

  async function onApplyCoupon() {
    const code = coupon.trim();
    if (!code) return;
    setCheckingCoupon(true);
    try {
      setCouponResult(await validateCoupon(code, subtotal));
    } catch {
      setCouponResult({ valid: false, discount: 0, message: 'No se pudo validar el cupón' });
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function onPlaceOrder(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const couponCode = couponResult?.valid ? coupon.trim() : undefined;
      let created: OrderView;
      let pay: PaymentView;
      if (user) {
        created = await checkout({ address: addr, buyerName: buyerName || undefined, couponCode });
        pay = await createPayment(created.id, 'YAPE');
      } else {
        // Invitado: los ítems vienen de la cesta local; el pago va por el flujo público.
        const items = getGuestCart().map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
        created = await guestCheckout({
          items,
          address: addr,
          email: guestEmail.trim(),
          name: buyerName || undefined,
          couponCode,
        });
        pay = await createGuestPayment(created.id, 'YAPE');
        clearGuestCart();
      }
      setOrder(created);
      setPayment(pay);
      await refresh(); // la cesta quedó vacía
      setStep('pay');
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No se pudo generar el pedido');
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmPayment() {
    if (!payment?.providerRef) return;
    setError(null);
    setBusy(true);
    try {
      await simulatePaymentConfirmation('YAPE', payment.providerRef);
      setStep('done');
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No se pudo confirmar el pago');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-10 border-b border-line pb-3 font-display text-3xl text-ink">Tramitar pedido</h1>

      {error && <p className="microcaps mb-6 text-sale">{error}</p>}

      {step === 'address' && (
        <form onSubmit={onPlaceOrder} className="space-y-6">
          {isGuest && (
            <div className="border border-line p-4">
              <p className="microcaps text-ink">Compra como invitado</p>
              <p className="microcaps mt-1 text-[10px] text-muted">
                No necesitas cuenta. Te enviaremos la confirmación al correo que dejes.{' '}
                <Link href="/ingresar?next=/checkout" className="text-ink hover:underline hover:underline-offset-4">
                  ¿Prefieres ingresar?
                </Link>
              </p>
              <div className="mt-3">
                <Field label="Correo" type="email" value={guestEmail} onChange={setGuestEmail} placeholder="tu@correo.com" />
              </div>
            </div>
          )}
          <h2 className="microcaps text-muted">Dirección de envío</h2>
          <div className="grid grid-cols-2 gap-6">
            <Field label="Departamento" value={addr.department} onChange={(v) => setAddr({ ...addr, department: v })} />
            <Field label="Provincia" value={addr.province} onChange={(v) => setAddr({ ...addr, province: v })} />
          </div>
          <Field label="Distrito" value={addr.district} onChange={(v) => setAddr({ ...addr, district: v })} />
          <Field label="Dirección" value={addr.line} onChange={(v) => setAddr({ ...addr, line: v })} placeholder="Jr. Gamarra 123, Galería…" />
          <div className="grid grid-cols-2 gap-6">
            <Field label="Referencia (opcional)" value={addr.reference ?? ''} onChange={(v) => setAddr({ ...addr, reference: v })} required={false} />
            <Field label="Celular (opcional)" value={addr.phone ?? ''} onChange={(v) => setAddr({ ...addr, phone: v })} required={false} placeholder="987654321" />
          </div>
          <Field label="Nombre de quien recibe (opcional)" value={buyerName} onChange={setBuyerName} required={false} />

          {/* Cupón de descuento */}
          <div className="border-t border-line pt-5">
            <span className="microcaps mb-2 block text-muted">Cupón de descuento (opcional)</span>
            <div className="flex items-baseline gap-3 border-b border-ink pb-1">
              <input
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value);
                  setCouponResult(null);
                }}
                placeholder="EJ. BIENVENIDA10"
                className="microcaps w-full bg-transparent uppercase text-ink placeholder:text-line focus:outline-none"
              />
              <button
                type="button"
                onClick={onApplyCoupon}
                disabled={checkingCoupon || !coupon.trim()}
                className="microcaps shrink-0 text-ink hover:underline hover:underline-offset-4 disabled:opacity-40"
              >
                {checkingCoupon ? '…' : 'Aplicar'}
              </button>
            </div>
            {couponResult && (
              <p className={`microcaps mt-2 ${couponResult.valid ? 'text-ink' : 'text-sale'}`}>
                {couponResult.valid ? `− ${money(couponResult.discount)} aplicado ✓` : couponResult.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="microcaps w-full bg-ink px-4 py-3.5 text-paper hover:opacity-80 disabled:opacity-50"
          >
            {busy ? 'Generando pedido…' : 'Continuar al pago'}
          </button>
        </form>
      )}

      {step === 'pay' && order && payment && (
        <div className="space-y-5 text-center">
          <h2 className="font-display text-2xl text-ink">Paga con Yape</h2>
          <p className="microcaps text-muted">
            Pedido <span className="text-ink">{order.number}</span>
          </p>

          <div className="mx-auto flex h-48 w-48 flex-col items-center justify-center border border-line p-4">
            <span className="font-display text-3xl text-ink">QR</span>
            <span className="microcaps mt-2 text-[9px] text-muted">Yape (demo)</span>
            <span className="mt-1 break-all text-[9px] text-line">{payment.providerRef}</span>
          </div>

          <div className="mx-auto max-w-xs space-y-1 border-t border-line pt-4 text-left">
            <Row k="Subtotal" v={money(order.subtotal)} />
            <Row k="Envío" v={order.shippingTotal > 0 ? money(order.shippingTotal) : 'Gratis'} />
            {order.discountTotal > 0 && <Row k="Descuento" v={`− ${money(order.discountTotal)}`} />}
            <div className="flex items-baseline justify-between border-t border-line pt-2 text-[15px] text-ink">
              <span className="microcaps">Total</span>
              <span>{money(order.grandTotal)}</span>
            </div>
          </div>
          <p className="microcaps mx-auto max-w-sm text-muted">
            En producción escanearías este QR con tu app de Yape. Aquí lo simulamos con el botón de abajo.
          </p>

          <button
            onClick={onConfirmPayment}
            disabled={busy}
            className="microcaps w-full bg-ink px-4 py-3.5 text-paper hover:opacity-80 disabled:opacity-50"
          >
            {busy ? 'Confirmando…' : 'Simular pago confirmado'}
          </button>
        </div>
      )}

      {step === 'done' && order && (
        <div className="py-10 text-center">
          <h2 className="font-display text-3xl text-ink">Pago confirmado</h2>
          <p className="microcaps mx-auto mt-4 max-w-sm leading-relaxed text-muted">
            Tu pedido <span className="text-ink">{order.number}</span> por {money(order.grandTotal)} está pagado. Las
            tiendas ya pueden prepararlo.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {isGuest ? (
              <Link
                href={`/rastrear?number=${encodeURIComponent(order.number)}&email=${encodeURIComponent(guestEmail.trim())}`}
                className="microcaps bg-ink px-8 py-3.5 text-paper hover:opacity-80"
              >
                Rastrear mi pedido
              </Link>
            ) : (
              <Link href="/mis-ordenes" className="microcaps bg-ink px-8 py-3.5 text-paper hover:opacity-80">
                Ver mis pedidos
              </Link>
            )}
            <Link href="/buscar" className="microcaps border border-ink px-8 py-3.5 text-ink hover:bg-ink hover:text-paper">
              Seguir comprando
            </Link>
          </div>
          {isGuest && (
            <p className="microcaps mx-auto mt-4 max-w-sm text-[10px] text-muted">
              Guarda tu número <span className="text-ink">{order.number}</span> para consultar tu pedido cuando quieras
              en “Rastrear pedido”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between text-[13px] text-muted">
      <span className="microcaps">{k}</span>
      <span className="text-ink">{v}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = true,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="microcaps mb-2 block text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
      />
    </label>
  );
}
