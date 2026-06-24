/**
 * Entidad de dominio Gallery (galería de Gamarra). Representación pura, sin
 * dependencias de framework ni de Prisma. Ver docs/03-diagrama-modulos.md.
 */
export interface Gallery {
  id: string;
  name: string;
  address: string;
  schedule: unknown | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  createdAt: Date;
}

export interface NewGallery {
  name: string;
  address: string;
  schedule?: unknown;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
}
