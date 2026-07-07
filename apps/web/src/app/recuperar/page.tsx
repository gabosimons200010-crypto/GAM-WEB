'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { requestPasswordReset, ClientApiError } from '@/lib/client-api';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await requestPasswordReset(email.trim());
      setDemoToken(r.demoToken ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'No pudimos procesar la solicitud');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-4xl text-ink">Recuperar contraseña</h1>
      <p className="microcaps mt-3 text-muted">Te enviaremos un enlace para crear una nueva contraseña.</p>

      {!sent ? (
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tucorreo@ejemplo.com"
              className="w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink placeholder:text-line focus:border-ink focus:outline-none"
            />
          </label>
          {error && <p className="microcaps text-sale">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
          >
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="border border-line p-4">
            <p className="microcaps text-ink">Revisa tu correo</p>
            <p className="microcaps mt-1 text-[10px] leading-relaxed text-muted">
              Si existe una cuenta con <span className="text-ink">{email.trim()}</span>, te enviamos un enlace para
              restablecer tu contraseña. El enlace vence en 15 minutos.
            </p>
          </div>

          {/* Modo demo: sin correo saliente, mostramos el enlace directamente. */}
          {demoToken && (
            <div className="border border-dashed border-ink bg-[#fafafa] p-4">
              <p className="microcaps text-ink">Modo demo — sin envío de correo</p>
              <p className="microcaps mt-1 text-[10px] leading-relaxed text-muted">
                En producción esto llegaría por correo. Aquí puedes continuar directamente:
              </p>
              <Link
                href={`/restablecer?email=${encodeURIComponent(email.trim())}&token=${encodeURIComponent(demoToken)}`}
                className="microcaps mt-3 inline-block bg-ink px-4 py-2.5 text-paper hover:opacity-80"
              >
                Restablecer mi contraseña →
              </Link>
            </div>
          )}

          <p className="microcaps text-[10px] text-muted">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/ingresar" className="text-ink hover:underline hover:underline-offset-4">
              Ingresar
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
