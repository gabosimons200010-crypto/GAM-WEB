import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contacto — Emporio' };

// Datos de contacto ficticios (demo).
const CONTACT = [
  { k: 'Correo', v: 'hola@emporio.pe', href: 'mailto:hola@emporio.pe' },
  { k: 'WhatsApp', v: '+51 987 654 321', href: 'https://wa.me/51987654321' },
  { k: 'Instagram', v: '@emporio.pe', href: 'https://instagram.com/emporio.pe' },
  { k: 'Atención', v: 'Lunes a sábado, 9:00 – 19:00' },
  { k: 'Ubicación', v: 'Perú' },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="border-b border-line pb-3 font-display text-4xl text-ink sm:text-5xl">Contacto</h1>
      <p className="microcaps mt-4 text-muted">
        ¿Dudas con tu pedido, cambios o quieres vender con nosotros? Escríbenos.
      </p>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {CONTACT.map((c) => (
          <div key={c.k} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[160px_1fr]">
            <span className="microcaps text-muted">{c.k}</span>
            {c.href ? (
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit border-b border-ink pb-0.5 text-[15px] text-ink transition hover:opacity-70"
              >
                {c.v}
              </a>
            ) : (
              <span className="text-[15px] text-ink">{c.v}</span>
            )}
          </div>
        ))}
      </div>

      <p className="microcaps mt-10 text-[10px] text-muted">Demo — datos de contacto de ejemplo.</p>
    </div>
  );
}
