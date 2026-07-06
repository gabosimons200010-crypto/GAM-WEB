'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ClientApiError } from '@/lib/client-api';

const SELLER_ROLES = ['VENDEDOR', 'ADMIN_TIENDA'];

export default function SellPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const authed = mounted && !!user;
  const isSeller = authed && (user!.roles.some((r) => SELLER_ROLES.includes(r)) || user!.stores.length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-12 py-6">
      <header className="border-b border-line pb-6">
        <p className="microcaps text-muted">Vendedores</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">Vende en Emporio</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink">
          Lleva tu marca de Gamarra a todo el Perú. Publica tu catálogo, gestiona tu stock y tus pedidos, y recibe tus
          pagos por Yape. Sin alquiler de stand online.
        </p>
      </header>

      {isSeller ? (
        <Panel title="Ya eres vendedor">
          <p className="microcaps text-muted">Entra a tu panel para gestionar productos, pedidos, ventas y pagos.</p>
          <Link href="/vendedor" className="microcaps mt-6 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
            Ir a mi panel de vendedor →
          </Link>
        </Panel>
      ) : (
        <>
          {!authed && <SellerLogin login={login} onDone={() => router.push('/vendedor')} />}
          <ApplyForm />
        </>
      )}
    </div>
  );
}

function SellerLogin({ login, onDone }: { login: (e: string, p: string) => Promise<void>; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(mail: string, pass: string) {
    setError(null);
    setBusy(true);
    try {
      await login(mail.trim(), pass);
      onDone();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'No pudimos iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="¿Ya tienes cuenta de vendedor?">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void submit(email, password);
        }}
        className="space-y-5"
      >
        <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        {error && <p className="microcaps text-sale">{error}</p>}
        <button type="submit" disabled={busy} className="microcaps bg-ink px-10 py-3.5 text-paper hover:opacity-80 disabled:opacity-50">
          {busy ? 'Ingresando…' : 'Entrar a mi cuenta'}
        </button>
      </form>
      <div className="mt-6 border-t border-line pt-5">
        <p className="microcaps mb-3 text-muted">Acceso rápido — demo</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit('vendedor@gamarra.go', 'Vendedor123')}
          className="microcaps border border-line px-4 py-2.5 text-ink transition hover:border-ink disabled:opacity-50"
        >
          Entrar como Vendedor demo
        </button>
      </div>
    </Panel>
  );
}

function ApplyForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ brand: '', name: '', email: '', phone: '', category: 'Ropa', message: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (sent) {
    return (
      <Panel title="Solicitud recibida ✓">
        <p className="microcaps text-muted">
          Gracias, <span className="text-ink">{form.brand || 'tu marca'}</span>. Revisaremos tu solicitud y te
          contactaremos al <span className="text-ink">{form.email}</span> en 24–48 h para activar tu tienda.
        </p>
        <p className="microcaps mt-3 text-[10px] text-muted">Demo — no se envió ningún correo real.</p>
      </Panel>
    );
  }

  return (
    <Panel title="¿Nuevo? Solicita empezar a vender">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setSent(true);
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nombre de la marca" value={form.brand} onChange={set('brand')} placeholder="Mi Marca" />
          <Field label="Tu nombre" value={form.name} onChange={set('name')} placeholder="Nombre y apellido" />
          <Field label="Correo" type="email" value={form.email} onChange={set('email')} placeholder="tucorreo@ejemplo.com" />
          <Field label="Celular / WhatsApp" value={form.phone} onChange={set('phone')} placeholder="987654321" />
        </div>
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Categoría principal</span>
          <select
            value={form.category}
            onChange={(e) => set('category')(e.target.value)}
            className="border-b border-ink bg-transparent pb-1 text-[13px] text-ink focus:outline-none"
          >
            {['Ropa', 'Streetwear', 'Casacas / outerwear', 'Pantalones / jeans', 'Polos / camisetas', 'Accesorios'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Cuéntanos de tu marca (opcional)</span>
          <textarea
            value={form.message}
            onChange={(e) => set('message')(e.target.value)}
            rows={3}
            className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
            placeholder="Galería, piso/stand, qué vendes, redes…"
          />
        </label>
        <button type="submit" className="microcaps bg-ink px-10 py-3.5 text-paper transition hover:opacity-80">
          Enviar solicitud
        </button>
      </form>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line p-6 sm:p-8">
      <h2 className="mb-5 font-display text-2xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
        required
        className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
      />
    </label>
  );
}
