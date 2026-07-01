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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No pudimos iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="text-xl font-bold">Ingresar</h1>
      <p className="mt-1 text-sm text-gray-500">Entra para comprar y ver tus órdenes.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="tucorreo@example.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link href="/registrarse" className="font-semibold text-brand-600 hover:underline">
          Regístrate
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
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-80 max-w-sm rounded-2xl bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
