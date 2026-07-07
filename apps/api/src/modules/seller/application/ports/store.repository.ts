import { StoreStatus, StoreView, StoreSettingsView, StoreSocial } from '../../domain/store';

export interface RegisterStoreData {
  ownerUserId: string;
  slug: string;
  commercialName: string;
  legalName?: string | null;
  ruc?: string | null;
  contactName?: string | null;
  email: string;
  phone: string;
  galleryId?: string | null;
  floor?: string | null;
  stand?: string | null;
  address?: string | null;
  categoryIds?: string[];
}

export interface UpdateStoreData {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  socials?: StoreSocial[];
  categoryIds?: string[];
}

export interface UpdateSettingsData {
  schedule?: unknown;
  preparationDays?: number;
  returnPolicy?: string | null;
  lowStockThreshold?: number;
}

export interface ListStoresFilter {
  status?: StoreStatus;
  query?: string;
  cursor?: string;
  limit: number;
}

export abstract class StoreRepository {
  abstract slugExists(slug: string): Promise<boolean>;
  abstract register(data: RegisterStoreData): Promise<StoreView>;
  abstract findById(id: string): Promise<StoreView | null>;
  abstract findBySlug(slug: string): Promise<StoreView | null>;
  abstract findByOwner(userId: string): Promise<StoreView[]>;
  abstract userOwnsStore(userId: string, storeId: string): Promise<boolean>;
  abstract update(storeId: string, data: UpdateStoreData): Promise<StoreView>;
  abstract getSettings(storeId: string): Promise<StoreSettingsView | null>;
  abstract upsertSettings(storeId: string, data: UpdateSettingsData): Promise<StoreSettingsView>;
  abstract setStatus(storeId: string, status: StoreStatus): Promise<void>;
  abstract setVerified(storeId: string, verified: boolean): Promise<void>;
  abstract list(filter: ListStoresFilter): Promise<{ items: StoreView[]; nextCursor: string | null }>;
}
