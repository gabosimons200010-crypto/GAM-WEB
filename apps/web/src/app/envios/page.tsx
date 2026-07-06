import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Envíos y devoluciones — Emporio' };

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="border-b border-line pb-3 font-display text-4xl text-ink sm:text-5xl">Envíos y devoluciones</h1>

      <div className="mt-10 space-y-10">
        <Section title="Envíos">
          <Row k="Cobertura" v="Todo el Perú." />
          <Row k="Lima" v="1 a 3 días hábiles." />
          <Row k="Provincias" v="3 a 7 días hábiles, según destino." />
          <Row k="Costo" v="Se calcula en el checkout según tu dirección." />
          <Row k="Seguimiento" v="Cada pedido tiene su estado y código de seguimiento en “Mis pedidos”." />
        </Section>

        <Section title="Cambios y devoluciones">
          <Row k="Plazo" v="Hasta 7 días desde que recibes tu pedido." />
          <Row k="Condición" v="Prenda sin uso, con etiquetas y en su empaque original." />
          <Row k="Cómo" v="Escríbenos desde Contacto con tu número de pedido y te guiamos." />
          <Row k="Reembolso" v="Se procesa por el mismo medio de pago (Yape) una vez recibida la prenda." />
        </Section>

        <p className="microcaps text-[10px] text-muted">
          Demo — políticas de ejemplo. Cada marca puede tener condiciones propias que se muestran en su tienda.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="microcaps mb-4 text-muted">{title}</h2>
      <div className="divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[160px_1fr]">
      <span className="microcaps text-ink">{k}</span>
      <span className="text-[14px] text-ink">{v}</span>
    </div>
  );
}
