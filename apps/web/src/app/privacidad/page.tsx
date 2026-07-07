import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Política de privacidad — Emporio' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="border-b border-line pb-3 font-display text-4xl text-ink sm:text-5xl">Política de privacidad</h1>
      <p className="microcaps mt-4 text-[10px] text-muted">Última actualización: julio 2026 · Documento de demostración.</p>

      <div className="mt-10 space-y-8 text-[14px] leading-relaxed text-ink">
        <Section title="1. Qué datos recopilamos">
          Datos de cuenta (nombre, correo), datos de contacto y envío (dirección, celular), y datos de tus pedidos.
          Los vendedores además registran datos de su empresa (RUC, razón social, persona a cargo).
        </Section>
        <Section title="2. Para qué los usamos">
          Para procesar tus pedidos y pagos, coordinar el envío, darte seguimiento, atender consultas y mejorar la
          plataforma. No vendemos tus datos a terceros.
        </Section>
        <Section title="3. Con quién los compartimos">
          Compartimos con la marca vendedora lo necesario para preparar y enviar tu pedido (nombre, dirección, contacto)
          y con los proveedores de pago y envío que hagan falta para completarlo.
        </Section>
        <Section title="4. Tus direcciones y pagos">
          Tus direcciones guardadas puedes gestionarlas en “Mis direcciones”. Nunca almacenamos contraseñas ni datos de
          tarjetas en texto plano; los pagos se procesan por el medio correspondiente (p. ej. Yape).
        </Section>
        <Section title="5. Tus derechos">
          Puedes acceder, corregir o eliminar tus datos y cerrar tu cuenta escribiéndonos desde Contacto. También puedes
          eliminar tus direcciones guardadas cuando quieras.
        </Section>
        <Section title="6. Cookies">
          Usamos almacenamiento local del navegador para tu sesión y tu carrito. No usamos cookies de rastreo
          publicitario de terceros.
        </Section>
        <p className="microcaps text-[10px] text-muted">
          Este es un texto de ejemplo para la demo y no constituye asesoría legal.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="microcaps mb-2 text-muted">{title}</h2>
      <p className="max-w-prose">{children}</p>
    </section>
  );
}
