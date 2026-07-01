'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { checkout, createPayment, simulatePaymentConfirmation, ClientApiError } from '@/lib/client-api';
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

  useEffect(() => {
    if (ready && !user) router.replace('/ingresar?next=/checkout');
  }, [ready, user, router]);

  async function onPlaceOrder(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await checkout({ address: addr, buyerName: buyerName || undefined });
      setOrder(created);
      const pay = await createPayment(created.id, 'YAPE');
      setPayment(pay);
      await refresh(); // el carrito quedó vacío
      setStep('pay');
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No se pudo generar la orden');
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

  if (!ready || !user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Finalizar compra</h1>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {step === 'address' && (
        <form onSubmit={onPlaceOrder} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Dirección de envío</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Departamento" value={addr.department} onChange={(v) => setAddr({ ...addr, department: v })} />
            <Field label="Provincia" value={addr.province} onChange={(v) => setAddr({ ...addr, province: v })} />
          </div>
          <Field label="Distrito" value={addr.district} onChange={(v) => setAddr({ ...addr, district: v })} />
          <Field label="Dirección" value={addr.line} onChange={(v) => setAddr({ ...addr, line: v })} placeholder="Jr. Gamarra 123, Galería…" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Referencia (opcional)" value={addr.reference ?? ''} onChange={(v) => setAddr({ ...addr, reference: v })} required={false} />
            <Field label="Celular (opcional)" value={addr.phone ?? ''} onChange={(v) => setAddr({ ...addr, phone: v })} required={false} placeholder="987654321" />
          </div>
          <Field label="Nombre de quien recibe (opcional)" value={buyerName} onChange={setBuyerName} required={false} />

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? 'Generando orden…' : 'Continuar al pago'}
          </button>
        </form>
      )}

      {step === 'pay' && order && payment && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 text-center">
          <h2 className="font-semibold">Paga con Yape</h2>
          <p className="text-sm text-gray-500">
            Orden <span className="font-mono font-semibold text-gray-700">{order.number}</span>
          </p>

          <div className="mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 p-4">
            <span className="text-5xl">📱</span>
            <span className="mt-2 text-xs text-gray-500">QR de Yape (demo)</span>
            <span className="mt-1 break-all font-mono text-[10px] text-gray-400">{payment.providerRef}</span>
          </div>

          <p className="text-2xl font-bold">{money(payment.amount)}</p>
          <p className="text-xs text-gray-400">
            En producción escanearías este QR con tu app de Yape. Aquí lo simulamos con el botón de abajo.
          </p>

          <button
            onClick={onConfirmPayment}
            disabled={busy}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {busy ? 'Confirmando…' : 'Simular pago confirmado ✅'}
          </button>
        </div>
      )}

      {step === 'done' && order && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-5xl">🎉</p>
          <h2 className="mt-3 text-xl font-bold text-green-800">¡Pago confirmado!</h2>
          <p className="mt-1 text-sm text-green-700">
            Tu orden <span className="font-mono font-semibold">{order.number}</span> por {money(order.grandTotal)} está pagada.
            Las tiendas ya pueden preparar tu pedido.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/mis-ordenes" className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
              Ver mis órdenes
            </Link>
            <Link href="/buscar" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-400">
              Seguir comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}
