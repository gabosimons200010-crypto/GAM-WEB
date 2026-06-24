import { ConflictException, Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { StoreRepository } from '../ports/store.repository';
import { StoreView, slugify } from '../../domain/store';
import { GrantRoleUseCase } from '../../../identity/application/use-cases/grant-role.use-case';
import { AuditLogger } from '../../../../shared/audit/audit-logger';

export interface RegisterStoreInput {
  ownerUserId: string;
  commercialName: string;
  legalName?: string;
  ruc?: string;
  email: string;
  phone: string;
  galleryId?: string;
  floor?: string;
  stand?: string;
  address?: string;
  categoryIds?: string[];
  ip?: string | null;
}

/**
 * Registro de tienda en 3 pasos (RF-SHOP-001). Crea la tienda en estado
 * IN_REVIEW, da de alta la membresía del dueño y le otorga el rol VENDEDOR.
 * La aprueba un admin (RF-ADM-001) en máximo 48 h.
 */
@Injectable()
export class RegisterStoreUseCase {
  constructor(
    private readonly stores: StoreRepository,
    private readonly grantRole: GrantRoleUseCase,
    private readonly audit: AuditLogger,
  ) {}

  async execute(input: RegisterStoreInput): Promise<StoreView> {
    const slug = await this.uniqueSlug(input.commercialName);
    return this.create(input, slug);
  }

  private async create(input: RegisterStoreInput, slug: string): Promise<StoreView> {
    let store: StoreView;
    try {
      store = await this.stores.register({
        ownerUserId: input.ownerUserId,
        slug,
        commercialName: input.commercialName,
        legalName: input.legalName ?? null,
        ruc: input.ruc ?? null,
        email: input.email,
        phone: input.phone,
        galleryId: input.galleryId ?? null,
        floor: input.floor ?? null,
        stand: input.stand ?? null,
        address: input.address ?? null,
        categoryIds: input.categoryIds ?? [],
      });
    } catch (e) {
      // Choque de unicidad (RUC ya registrado).
      if (this.isUniqueViolation(e)) {
        throw new ConflictException('Ya existe una tienda con ese RUC');
      }
      throw e;
    }

    await this.grantRole.execute(input.ownerUserId, RoleName.VENDEDOR);
    await this.audit.log({
      actorId: input.ownerUserId,
      action: 'store.register',
      entity: 'Store',
      entityId: store.id,
      metadata: { commercialName: store.commercialName },
      ip: input.ip,
    });
    return store;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'tienda';
    let candidate = base;
    let n = 1;
    while (await this.stores.slugExists(candidate)) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    return candidate;
  }

  private isUniqueViolation(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002'
    );
  }
}
