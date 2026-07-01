'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ClientApiError } from '@/lib/client-api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim() || undefined);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No pudimos crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="text-xl font-bold">Crear cuenta</h1>
      <p className="mt-1 text-sm text-gray-500">Regístrate para comprar en GAMARRA GO.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Nombre" type="text" value={fullName} onChange={setFullName} placeholder="María Pérez" required={false} />
        <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="tucorreo@example.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" />
        <p className="text-xs text-gray-400">Usa al menos 8 caracteres, con mayúscula y número.</p>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/ingresar" className="font-semibold text-brand-600 hover:underline">
          Ingresa
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
  required = true,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}
