export abstract class LoginAttemptRepository {
  abstract record(identifier: string, success: boolean, ip?: string | null): Promise<void>;
  /** Nº de intentos fallidos del identificador desde `since`. */
  abstract countRecentFailures(identifier: string, since: Date): Promise<number>;
}
