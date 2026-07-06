'use client';

// Seguimiento de envío con vida: nodos con íconos, progreso animado,
// nodo actual latiendo y un tramo "en camino" en movimiento.

const STEPS = [
  { key: 'PAID', label: 'Pagado', icon: IconCheck },
  { key: 'PREPARING', label: 'Preparando', icon: IconBox },
  { key: 'SHIPPED', label: 'Enviado', icon: IconTruck },
  { key: 'DELIVERED', label: 'Entregado', icon: IconHome },
] as const;

// READY_FOR_PICKUP se muestra en el tramo de "Enviado".
function normalize(status: string): string {
  if (status === 'READY_FOR_PICKUP') return 'SHIPPED';
  return status;
}

export function OrderTimeline({ status }: { status: string }) {
  const cancelled = status === 'CANCELLED' || status === 'RETURNED' || status === 'DELIVERY_FAILED';
  const norm = normalize(status);
  const current = Math.max(0, STEPS.findIndex((s) => s.key === norm));
  const done = norm === 'DELIVERED';

  if (cancelled) {
    return (
      <div className="mt-3 inline-flex items-center gap-2 border border-line px-3 py-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-sale" />
        <span className="microcaps text-sale">
          {status === 'RETURNED' ? 'Devuelto' : status === 'DELIVERY_FAILED' ? 'Entrega fallida' : 'Cancelado'}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const isDone = i < current || done;
          const isCurrent = i === current && !done;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Tramo izquierdo del conector */}
                <Connector filled={i <= current} active={i === current && !done} side={i === 0} />
                {/* Nodo */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isDone
                      ? 'border-ink bg-ink text-paper'
                      : isCurrent
                        ? 'gg-pulse border-ink bg-paper text-ink'
                        : 'border-line bg-paper text-line'
                  }`}
                >
                  <Icon />
                </div>
                {/* Tramo derecho del conector */}
                <Connector filled={i < current} active={i === current && !done && i < STEPS.length - 1} side={i === STEPS.length - 1} />
              </div>
              <span
                className={`microcaps mt-2 text-[9px] ${isCurrent ? 'text-ink' : isDone ? 'text-ink' : 'text-muted'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Connector({ filled, active, side }: { filled: boolean; active: boolean; side: boolean }) {
  // side = extremo (izq del primer nodo o der del último): invisible, solo alinea.
  if (side) return <div className="h-8 flex-1" />;
  return (
    <div className="relative h-8 flex-1">
      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-line" />
      {active ? (
        // Tramo "en camino": rayas en movimiento + camión deslizándose.
        <>
          <div className="gg-dashes absolute top-1/2 h-px w-full -translate-y-1/2" />
          <div className="gg-truck absolute top-1/2 -translate-y-1/2">
            <span className="block h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink" />
          </div>
        </>
      ) : (
        filled && <div className="gg-grow absolute top-1/2 h-px w-full -translate-y-1/2 bg-ink" />
      )}
    </div>
  );
}

/* ── Íconos (line, heredan currentColor) ── */
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h13v11H1zM14 8h4l3 3v4h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
