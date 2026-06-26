import { SearchFilters, SearchResult } from '../../domain/search';

/**
 * Puerto de búsqueda del catálogo público. La implementación de Fase 2 es
 * sobre PostgreSQL (filtros + ILIKE/trgm). Cuando el volumen lo exija se
 * sustituye por un adaptador OpenSearch sin tocar los casos de uso
 * (RNF-ESC-003) — esa es la razón de ser de este puerto.
 */
export abstract class CatalogSearchPort {
  abstract search(filters: SearchFilters): Promise<SearchResult>;
}
