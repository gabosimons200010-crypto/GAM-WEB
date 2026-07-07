export type StoreStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export interface StoreSocial {
  platform: string;
  url: string;
}

export interface StoreView {
  id: string;
  slug: string;
  commercialName: string;
  legalName: string | null;
  ruc: string | null;
  contactName: string | null;
  email: string;
  phone: string;
  galleryId: string | null;
  floor: string | null;
  stand: string | null;
  address: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  status: StoreStatus;
  verified: boolean;
  rating: number;
  salesCount: number;
  createdAt: Date;
  socials: StoreSocial[];
  categoryIds: string[];
}

export interface StoreSettingsView {
  storeId: string;
  schedule: unknown | null;
  preparationDays: number;
  returnPolicy: string | null;
  lowStockThreshold: number;
}

/** Convierte un texto en slug URL-safe (ASCII, minúsculas, guiones). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos (diacríticos combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
