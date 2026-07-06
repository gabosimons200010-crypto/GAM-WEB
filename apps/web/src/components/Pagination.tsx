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

  return (
    <div className="microcaps mt-12 flex items-center justify-center gap-8">
      {page > 1 ? (
        <Link href={href(page - 1)} className="border-b border-ink pb-0.5 text-ink hover:opacity-70">
          Anterior
        </Link>
      ) : (
        <span className="text-line">Anterior</span>
      )}

      <span className="text-muted">Página {page}</span>

      {hasMore ? (
        <Link href={href(page + 1)} className="border-b border-ink pb-0.5 text-ink hover:opacity-70">
          Siguiente
        </Link>
      ) : (
        <span className="text-line">Siguiente</span>
      )}
    </div>
  );
}
