'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, FormEvent } from 'react';
import { resetPassword, ClientApiError } from '@/lib/client-api';

const PASSWORD_OK = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RestablecerPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-80 max-w-sm" />}>
      <Restablecer />
    </Suspense>
  );
}

function Restablecer() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setEmail(params.get('email') ?? '');
    setToken(params.get('token') ?? '');
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!PASSWORD_OK.test(password)) {
      setError('La contraseña requiere mínimo 8 caracteres, una mayúscula y un número.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email.trim(), token.trim(), password);
      setDone(true);
      setTimeout(() => router.push('/ingresar'), 2500);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No pudimos restablecer la contraseña');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <h1 className="font-display text-3xl text-ink">Contraseña actualizada</h1>
        <p className="microcaps mx-auto mt-4 max-w-xs leading-relaxed text-muted">
          Ya puedes ingresar con tu nueva contraseña. Te llevamos al ingreso…
        </p>
        <Link href="/ingresar" className="microcaps mt-8 inline-block bg-ink px-8 py-3.5 text-paper hover:opacity-80">
          Ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-4xl text-ink">Nueva contraseña</h1>
      <p className="microcaps mt-3 text-muted">Crea una contraseña para {email || 'tu cuenta'}.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {!params.get('token') && (
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Código del enlace</span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Pega aquí el código"
              className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
            />
          </label>
        )}
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Nueva contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="microcaps mb-2 block text-muted">Repetir contraseña</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
          />
        </label>
        <p className="microcaps text-[10px] text-muted">Mínimo 8 caracteres, una mayúscula y un número.</p>

        {error && <p className="microcaps text-sale">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}
