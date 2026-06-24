import { ConflictException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { RegisterStoreUseCase } from './register-store.use-case';
import {
  StoreRepository,
  RegisterStoreData,
  UpdateStoreData,
  UpdateSettingsData,
  ListStoresFilter,
} from '../ports/store.repository';
import { StoreView, StoreSettingsView, StoreStatus } from '../../domain/store';
import { GrantRoleUseCase } from '../../../identity/application/use-cases/grant-role.use-case';
import { AuditLogger, AuditEntry } from '../../../../shared/audit/audit-logger';

function buildStore(over: Partial<StoreView> = {}): StoreView {
  return {
    id: 'st_1',
    slug: 'modas-karla',
    commercialName: 'Modas Karla',
    legalName: null,
    ruc: null,
    email: 'a@b.com',
    phone: '987654321',
    galleryId: null,
    floor: null,
    stand: null,
    address: null,
    logoUrl: null,
    bannerUrl: null,
    description: null,
    status: 'IN_REVIEW',
    verified: false,
    rating: 0,
    salesCount: 0,
    createdAt: new Date('2026-01-01'),
    socials: [],
    categoryIds: [],
    ...over,
  };
}

class FakeStores extends StoreRepository {
  public registered: RegisterStoreData[] = [];
  private existing = new Set<string>();

  constructor(existingSlugs: string[] = []) {
    super();
    existingSlugs.forEach((s) => this.existing.add(s));
  }
  async slugExists(slug: string) {
    return this.existing.has(slug);
  }
  async register(data: RegisterStoreData): Promise<StoreView> {
    this.registered.push(data);
    return buildStore({ slug: data.slug, commercialName: data.commercialName });
  }
  async findById() {
    return null;
  }
  async findBySlug() {
    return null;
  }
  async findByOwner() {
    return [];
  }
  async userOwnsStore() {
    return false;
  }
  async update(_id: string, _d: UpdateStoreData): Promise<StoreView> {
    return buildStore();
  }
  async getSettings() {
    return null;
  }
  async upsertSettings(_id: string, _d: UpdateSettingsData): Promise<StoreSettingsView> {
    return { storeId: 'st_1', schedule: null, preparationDays: 2, returnPolicy: null, lowStockThreshold: 5 };
  }
  async setStatus(_id: string, _s: StoreStatus) {}
  async setVerified() {}
  async list(_f: ListStoresFilter) {
    return { items: [], nextCursor: null };
  }
}

class FakeGrantRole extends GrantRoleUseCase {
  public granted: { userId: string; role: RoleName }[] = [];
  constructor() {
    super({} as never);
  }
  async execute(userId: string, role: RoleName) {
    this.granted.push({ userId, role });
  }
}

class FakeAudit extends AuditLogger {
  public entries: AuditEntry[] = [];
  async log(entry: AuditEntry) {
    this.entries.push(entry);
  }
}

describe('RegisterStoreUseCase', () => {
  it('registra tienda IN_REVIEW, otorga rol VENDEDOR y audita', async () => {
    const stores = new FakeStores();
    const grant = new FakeGrantRole();
    const audit = new FakeAudit();
    const useCase = new RegisterStoreUseCase(stores, grant, audit);

    const store = await useCase.execute({
      ownerUserId: 'u1',
      commercialName: 'Modas Karla',
      email: 'a@b.com',
      phone: '987654321',
    });

    expect(store.status).toBe('IN_REVIEW');
    expect(stores.registered[0].slug).toBe('modas-karla');
    expect(grant.granted).toEqual([{ userId: 'u1', role: RoleName.VENDEDOR }]);
    expect(audit.entries[0].action).toBe('store.register');
  });

  it('genera un slug único cuando el nombre ya existe', async () => {
    const stores = new FakeStores(['modas-karla']);
    const useCase = new RegisterStoreUseCase(stores, new FakeGrantRole(), new FakeAudit());

    await useCase.execute({
      ownerUserId: 'u1',
      commercialName: 'Modas Karla',
      email: 'a@b.com',
      phone: '987654321',
    });

    expect(stores.registered[0].slug).toBe('modas-karla-2');
  });

  it('traduce choque de RUC (P2002) a Conflict', async () => {
    const stores = new FakeStores();
    stores.register = async () => {
      throw { code: 'P2002' };
    };
    const useCase = new RegisterStoreUseCase(stores, new FakeGrantRole(), new FakeAudit());

    await expect(
      useCase.execute({
        ownerUserId: 'u1',
        commercialName: 'X',
        email: 'a@b.com',
        phone: '987654321',
        ruc: '20123456789',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
