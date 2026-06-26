import Link from 'next/link';

/** Paginación por número de página, preservando los filtros actuales. */
export function Pagination({
  basePath,
  query,
  page,
  hasMore,
}: {
  basePath: string;
  query: Record<string, string | undefined>;
  page: number;
  hasMore: boolean;
}) {
  if (page <= 1 && !hasMore) return null;

  function href(targetPage: number): string {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
    q.set('page', String(targetPage));
    return `${basePath}?${q.toString()}`;
  }

  const btn = 'rounded-lg border px-4 py-2 text-sm font-medium';
  const enabled = 'border-gray-300 bg-white text-gray-700 hover:border-brand-400 hover:text-brand-600';
  const disabled = 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300';

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${btn} ${enabled}`}>
          ← Anterior
        </Link>
      ) : (
        <span className={`${btn} ${disabled}`}>← Anterior</span>
      )}

      <span className="text-sm text-gray-500">Página {page}</span>

      {hasMore ? (
        <Link href={href(page + 1)} className={`${btn} ${enabled}`}>
          Siguiente →
        </Link>
      ) : (
        <span className={`${btn} ${disabled}`}>Siguiente →</span>
      )}
    </div>
  );
}
