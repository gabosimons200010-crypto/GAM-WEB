export interface SessionRecord {
  id: string;
  userId: string;
  refreshHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateSessionData {
  userId: string;
  refreshHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}

export abstract class SessionRepository {
  abstract create(data: CreateSessionData): Promise<SessionRecord>;
  abstract findById(id: string): Promise<SessionRecord | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}
