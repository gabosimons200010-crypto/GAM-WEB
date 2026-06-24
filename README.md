# GAMARRA GO

Marketplace multi-tienda de prendas de vestir de las galerías de **Gamarra** (Lima, Perú), con
catalogación automática por IA. Inspirado en Rappi y Mercado Libre.

> **Estado:** en construcción. La arquitectura completa está aprobada y documentada en [`docs/`](./docs).
> Esta fase implementa el **Sprint 0 (Fundaciones)** + el módulo de referencia (Galerías), según el
> [plan de implementación](./docs/12-plan-implementacion.md).

## Monorepo

```
apps/
  api/          NestJS — monolito modular (REST + dominio + workers)
packages/
  config/       tsconfig y eslint compartidos
infra/
  docker-compose.yml   Postgres(pgvector) · Redis · OpenSearch · MinIO
docs/           dossier de arquitectura (01..12)
```

Las demás apps (`storefront`, `dashboard`, `mobile-buyer`, `mobile-seller`) y módulos de dominio se
incorporan por sprint — ver [estructura objetivo](./docs/11-estructura-carpetas.md).

## Requisitos

- Node.js 20 (`.nvmrc`)
- pnpm 9 (`corepack enable`)
- Docker + Docker Compose

## Puesta en marcha (local)

```bash
# 1. Variables de entorno
cp .env.example apps/api/.env        # ajusta DATABASE_URL, etc. si hace falta

# 2. Infraestructura de soporte
pnpm infra:up                        # postgres, redis, opensearch, minio

# 3. Dependencias
pnpm install

# 4. Base de datos: migración + semilla
pnpm --filter @gamarra/api prisma:generate
pnpm db:migrate                      # crea el esquema (docs/04)
pnpm db:seed                         # roles, permisos, categorías, galerías

# 5. API en modo desarrollo
pnpm --filter @gamarra/api dev
```

- API: `http://localhost:4000/api/v1`
- Health: `http://localhost:4000/api/v1/health`
- OpenAPI (Swagger): `http://localhost:4000/api/docs`

### Endpoints disponibles

**Sprint 0 — base**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Estado del servicio y de la BD |
| GET | `/api/v1/galleries` | Lista de galerías de Gamarra |
| GET | `/api/v1/galleries/:id` | Detalle de una galería |
| POST | `/api/v1/galleries` | Crear galería — **requiere rol ADMIN** (Bearer token) |

**Sprint 1 — identidad y acceso (`RF-AUTH`)**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register/email` | Registro email + contraseña (RF-AUTH-001) |
| POST | `/api/v1/auth/confirm-email` | Confirmar email con token |
| POST | `/api/v1/auth/register/phone` | Solicitar OTP por celular (RF-AUTH-002) |
| POST | `/api/v1/auth/verify-otp` | Verificar OTP → auto-login |
| POST | `/api/v1/auth/login` | Login (5/min/IP, bloqueo a los 5 fallos) |
| POST | `/api/v1/auth/refresh` | Rotar refresh token (cookie HttpOnly) |
| POST | `/api/v1/auth/logout` | Cerrar sesión server-side (RF-AUTH-005) |
| POST | `/api/v1/auth/password/forgot` | Solicitar reset (RF-AUTH-004) |
| POST | `/api/v1/auth/password/reset` | Establecer nueva contraseña |
| GET | `/api/v1/auth/me` | Usuario autenticado (Bearer token) |

El access token (JWT, 15 min) va en `Authorization: Bearer`. El refresh token (30 días, rotativo) viaja
en cookie HttpOnly. En desarrollo, los códigos de email/OTP/reset se imprimen en el log del API
(`CodeDelivery`); en sprints siguientes se enviarán por email/WhatsApp/SMS vía la cola de notificaciones.

Usuario admin de prueba creado por la semilla: **admin@gamarra.go / Admin123**.

## Ramas por sprint

Cada sprint tiene una rama-snapshot acumulativa para que puedas probar cada avance por separado:

- `sprint/0-fundaciones` — monorepo + API + módulo Galerías
- `sprint/1-identidad-acceso` — + autenticación, RBAC, sesiones
- (la rama de integración acumula lo último)

## Scripts útiles

```bash
pnpm typecheck      # verificación de tipos en todo el monorepo
pnpm lint           # linting
pnpm test           # pruebas (incluye casos de uso de Galerías)
pnpm build          # build de producción
pnpm infra:down     # detener infraestructura local
```

## Próximos pasos (roadmap)

Sprint 1: Identidad y acceso (`RF-AUTH`) · Sprint 2: Tiendas + Gamarra admin ·
Sprint 3: Catálogo e inventario · Sprints 4–6: IA de catalogación. Detalle en
[`docs/12-plan-implementacion.md`](./docs/12-plan-implementacion.md).
