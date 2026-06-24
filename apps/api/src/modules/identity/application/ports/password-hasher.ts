/** Puerto de hashing de contraseñas. Implementación con bcrypt cost 12 (RNF-SEC-002). */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract compare(plain: string, hash: string): Promise<boolean>;
}
