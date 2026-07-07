'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ClientApiError } from '@/lib/client-api';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(mail: string, pass: string) {
    setError(null);
    setLoading(true);
    try {
      await login(mail.trim(), pass);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No pudimos iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-4xl text-ink">Ingresar</h1>
      <p className="microcaps mt-3 text-muted">Entra para comprar, vender y ver tus pedidos.</p>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void submit(email, password);
        }}
        className="mt-8 space-y-6"
      >
        <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

        <div className="text-right">
          <Link href="/recuperar" className="microcaps text-[10px] text-muted hover:text-ink">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="microcaps text-sale">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="microcaps mt-6 text-muted">
        ¿No tienes cuenta?{' '}
        <Link href="/registrarse" className="border-b border-ink pb-0.5 text-ink hover:opacity-70">
          Crear cuenta
        </Link>
      </p>

      <p className="microcaps mt-10 border-t border-line pt-6 text-[10px] text-muted">
        ¿Eres una marca?{' '}
        <Link href="/vender" className="text-ink hover:underline hover:underline-offset-4">
          Vende en Emporio →
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-80 max-w-sm" />}>
      <LoginForm />
    </Suspense>
  );
}
