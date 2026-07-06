import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Guía de tallas — Emporio' };

// Medidas de referencia (cm). Demo.
const TOPS = [
  { size: 'XS', chest: '86–91', length: '66' },
  { size: 'S', chest: '91–97', length: '68' },
  { size: 'M', chest: '97–102', length: '70' },
  { size: 'L', chest: '102–107', length: '72' },
  { size: 'XL', chest: '107–112', length: '74' },
];

const BOTTOMS = [
  { size: 'XS', waist: '71–76', hip: '86–91' },
  { size: 'S', waist: '76–81', hip: '91–97' },
  { size: 'M', waist: '81–86', hip: '97–102' },
  { size: 'L', waist: '86–91', hip: '102–107' },
  { size: 'XL', waist: '91–97', hip: '107–112' },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="border-b border-line pb-3 font-display text-4xl text-ink sm:text-5xl">Guía de tallas</h1>
      <p className="microcaps mt-4 text-muted">
        Medidas en centímetros. Si estás entre dos tallas y buscas un corte holgado (oversize), elige la mayor.
      </p>

      <div className="mt-10 space-y-12">
        <Table
          title="Prendas superiores — polos, hoodies, casacas"
          cols={['Talla', 'Pecho (cm)', 'Largo (cm)']}
          rows={TOPS.map((r) => [r.size, r.chest, r.length])}
        />
        <Table
          title="Prendas inferiores — pantalones, jeans, cargos"
          cols={['Talla', 'Cintura (cm)', 'Cadera (cm)']}
          rows={BOTTOMS.map((r) => [r.size, r.waist, r.hip])}
        />
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <h2 className="microcaps mb-3 text-muted">Cómo medir</h2>
        <ul className="space-y-2 text-[14px] text-ink">
          <li>· <b>Pecho:</b> rodea la parte más ancha del pecho, bajo las axilas.</li>
          <li>· <b>Cintura:</b> rodea la parte más estrecha del torso.</li>
          <li>· <b>Cadera:</b> rodea la parte más ancha de la cadera.</li>
        </ul>
      </div>

      <p className="microcaps mt-10 text-[10px] text-muted">
        Demo — tabla de referencia. Cada marca puede indicar su propio calce en la ficha del producto.
      </p>
    </div>
  );
}

function Table({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <section>
      <h2 className="microcaps mb-4 text-muted">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-line">
              {cols.map((c) => (
                <th key={c} className="microcaps px-3 py-3 text-ink">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line">
                {r.map((cell, j) => (
                  <td key={j} className={`px-3 py-3 text-[14px] ${j === 0 ? 'font-display text-lg text-ink' : 'text-ink'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
