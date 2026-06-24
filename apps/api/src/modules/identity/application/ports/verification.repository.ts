import { VerificationPurpose } from '@prisma/client';

export interface VerificationRecord {
  id: string;
  userId: string | null;
  identifier: string;
  purpose: VerificationPurpose;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
}

export interface CreateVerificationData {
  userId?: string | null;
  identifier: string;
  purpose: VerificationPurpose;
  tokenHash: string;
  expiresAt: Date;
}

export abstract class VerificationRepository {
  abstract create(data: CreateVerificationData): Promise<VerificationRecord>;
  /** Último token vigente (no consumido, no expirado) para identificador+propósito. */
  abstract findActive(
    identifier: string,
    purpose: VerificationPurpose,
  ): Promise<VerificationRecord | null>;
  abstract incrementAttempts(id: string): Promise<void>;
  abstract consume(id: string): Promise<void>;
  /** Invalida cualquier token previo del mismo identificador+propósito. */
  abstract invalidateAll(identifier: string, purpose: VerificationPurpose): Promise<void>;
}
