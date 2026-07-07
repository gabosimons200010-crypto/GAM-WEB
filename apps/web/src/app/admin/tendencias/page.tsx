'use client';

import { useEffect, useState } from 'react';
import { adminSalesByStyle, ClientApiError } from '@/lib/client-api';
import type { SalesByStyleResult } from '@/lib/client-api';
import { money } from '@/lib/format';

export default function TrendsPage() {
  const [data, setData] = useState<SalesByStyleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminSalesByStyle()
      .then(setData)
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'No pudimos cargar la analítica'));
  }, []);

  if (error) return <p className="microcaps text-sale">{error}</p>;
  if (!data) return <p className="microcaps text-muted">Cargando tendencias…</p>;

  const maxUnits = Math.max(1, ...data.styles.map((s) => s.units));

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Tendencias</h1>
        <p className="microcaps mt-2 text-[11px] text-muted">
          Qué estilos se venden más. Base para el pronóstico de tendencias.
        </p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
        <Stat label="Unidades vendidas" value={data.totals.units.toLocaleString('es-PE')} />
        <Stat label="Ingreso estimado" value={money(data.totals.revenue)} />
        <Stat label="Productos activos" value={String(data.totals.products)} />
        <Stat label="Estilos" value={String(data.totals.styles)} />
      </div>

      {/* Ranking por estilo */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="microcaps text-muted">Ventas por estilo / look</h2>
          <span className="microcaps text-[10px] text-muted">unidades · ingreso</span>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {data.styles.map((s, i) => (
            <li key={s.style} className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2">
                  <span className="microcaps w-5 text-muted">{i + 1}</span>
                  <span className="microcaps text-ink">{s.style}</span>
                  <span className="microcaps text-[10px] text-muted">· {s.products} prod</span>
                </span>
                <span className="flex items-baseline gap-4">
                  <span className="text-[15px] text-ink">{s.units.toLocaleString('es-PE')}</span>
                  <span className="microcaps w-24 text-right text-muted">{money(s.revenue)}</span>
                </span>
              </div>
              {/* Barra proporcional a unidades */}
              <div className="mt-2 h-1.5 w-full overflow-hidden bg-[#f1f1f1]">
                <div className="h-full bg-ink transition-all" style={{ width: `${(s.units / maxUnits) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-line bg-[#fafafa] p-4">
        <p className="microcaps text-ink">Cómo leerlo</p>
        <p className="microcaps mt-1 text-[10px] leading-relaxed text-muted">
          Un producto puede tener varios estilos, así que los porcentajes se solapan (suman más de 100%). La métrica de
          ventas usa el histórico acumulado de cada producto. <span className="text-ink">Próximo paso:</span> con más
          historial de pedidos se añade evolución en el tiempo y pronóstico (estacionalidad y momentum por estilo).
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper p-4">
      <p className="microcaps text-[10px] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
