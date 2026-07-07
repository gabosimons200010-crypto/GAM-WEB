import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Términos y condiciones — Emporio' };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="border-b border-line pb-3 font-display text-4xl text-ink sm:text-5xl">Términos y condiciones</h1>
      <p className="microcaps mt-4 text-[10px] text-muted">Última actualización: julio 2026 · Documento de demostración.</p>

      <div className="mt-10 space-y-8 text-[14px] leading-relaxed text-ink">
        <Section title="1. Qué es Emporio">
          Emporio es un marketplace que conecta a marcas independientes del Perú con compradores. Cada marca (tienda) es
          responsable de sus productos, precios, stock y despacho. Emporio facilita la vitrina, el carrito, el pago y el
          seguimiento del pedido.
        </Section>
        <Section title="2. Cuentas">
          Puedes comprar como invitado o crear una cuenta. Eres responsable de mantener la confidencialidad de tu
          contraseña y de la actividad de tu cuenta. Los vendedores deben registrar datos veraces de su empresa (RUC,
          razón social, contacto).
        </Section>
        <Section title="3. Pedidos y pagos">
          Al confirmar un pedido reservamos el stock y generamos el cobro. El precio final incluye el envío calculado
          según tu dirección. Puedes cancelar un pedido mientras no haya salido; en ese caso se repone el stock y, si ya
          pagaste, se gestiona el reembolso por el mismo medio.
        </Section>
        <Section title="4. Envíos y devoluciones">
          Los plazos y costos de envío se muestran en el checkout. Las devoluciones se rigen por la política publicada en
          Envíos y devoluciones y por las condiciones propias de cada marca.
        </Section>
        <Section title="5. Contenido de las marcas">
          Las imágenes, textos y marcas pertenecen a cada tienda. Está prohibido copiar o reutilizar ese contenido sin
          autorización de su titular.
        </Section>
        <Section title="6. Responsabilidad">
          Emporio no fabrica los productos; la responsabilidad sobre calidad, tallas y entrega recae en la marca
          vendedora. Ante cualquier inconveniente, escríbenos desde Contacto y mediamos para resolverlo.
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
