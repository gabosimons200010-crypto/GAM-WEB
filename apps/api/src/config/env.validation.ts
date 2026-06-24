import { z } from 'zod';

/**
 * Esquema de variables de entorno. Falla rápido al arrancar si falta algo crítico,
 * en lugar de romper en runtime.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  OPENSEARCH_NODE: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(8).default('change-me-access'),
  JWT_REFRESH_SECRET: z.string().min(8).default('change-me-refresh'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2592000),

  AI_PROVIDER: z.enum(['gemini', 'anthropic', 'openai']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),

  PUBLIC_WEB_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${issues}`);
  }
  return parsed.data;
}
