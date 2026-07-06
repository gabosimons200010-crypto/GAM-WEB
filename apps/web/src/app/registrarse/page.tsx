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
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-4xl text-ink">Crear cuenta</h1>
      <p className="microcaps mt-3 text-muted">Regístrate para comprar en Emporio.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <Field label="Nombre" type="text" value={fullName} onChange={setFullName} placeholder="María Pérez" required={false} />
        <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" />
        <p className="microcaps text-[10px] text-muted">Usa al menos 8 caracteres, con mayúscula y número.</p>

        {error && <p className="microcaps text-sale">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="microcaps mt-6 text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/ingresar" className="border-b border-ink pb-0.5 text-ink hover:opacity-70">
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
