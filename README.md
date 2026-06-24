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

### Endpoints disponibles (Sprint 0)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Estado del servicio y de la BD |
| GET | `/api/v1/galleries` | Lista de galerías de Gamarra |
| GET | `/api/v1/galleries/:id` | Detalle de una galería |
| POST | `/api/v1/galleries` | Crear galería (se protegerá con rol ADMIN en Sprint 1) |

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
