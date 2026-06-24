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

**Sprint 2 — tiendas y administración (`RF-SHOP-001`, `RF-ADM-001`)**

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/v1/seller/stores` | autenticado | Registrar tienda (3 pasos) → IN_REVIEW (RF-SHOP-001) |
| GET | `/api/v1/seller/stores` | autenticado | Mis tiendas |
| PATCH | `/api/v1/seller/stores/:id` | VENDEDOR | Editar logo/banner/descripción/redes/categorías |
| PATCH | `/api/v1/seller/stores/:id/settings` | VENDEDOR | Horario, prep., política, umbral stock (RF-SHOP-010) |
| GET | `/api/v1/stores/:slug` | público | Perfil público de tienda aprobada (RF-CAT-006) |
| GET | `/api/v1/admin/stores` | ADMIN | Listar/buscar tiendas (RF-ADM-001) |
| POST | `/api/v1/admin/stores/:id/approve` | ADMIN | Aprobar tienda (auditado) |
| POST | `/api/v1/admin/stores/:id/reject` | ADMIN | Rechazar con motivo |
| POST | `/api/v1/admin/stores/:id/suspend` | ADMIN | Suspender con motivo |
| POST | `/api/v1/admin/stores/:id/verify` | ADMIN | Otorgar badge "verificada" |

Toda acción de administración queda registrada en `AuditLog` (RF-ADM-006). El acceso de cada vendedor
está aislado a sus propias tiendas (RF-AUTH-006).

**Sprint 3 — catálogo e inventario (`RF-SHOP-003`, `RF-SHOP-005`)**

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/v1/seller/stores/:storeId/products` | VENDEDOR | Crear producto con variantes talla/color (RF-SHOP-003) |
| GET | `/api/v1/seller/stores/:storeId/products?lowStock=true` | VENDEDOR | Listar productos; filtro de stock bajo (RF-SHOP-005) |
| PATCH | `/api/v1/seller/stores/:storeId/products/:productId` | VENDEDOR | Editar producto |
| POST | `/api/v1/seller/stores/:storeId/products/:productId/archive` | VENDEDOR | Archivar |
| DELETE | `/api/v1/seller/stores/:storeId/products/:productId` | VENDEDOR | Eliminar |
| PATCH | `/api/v1/seller/stores/:storeId/products/variants/:variantId/inventory` | VENDEDOR | Ajustar stock → emite `StockLow` si baja del umbral |
| POST | `/api/v1/seller/stores/:storeId/products/upload-url` | VENDEDOR | URL prefirmada para subir imagen (JPG/PNG/WebP, RNF-SEC-007) |
| GET | `/api/v1/products/:slug` | público | Detalle de producto activo (RF-CAT-003) |
| GET | `/api/v1/categories` | público | Árbol de categorías |

El SKU se genera por producto y por variante (adelanto de IA-006). Las imágenes se suben directo a
S3/R2/MinIO con URL prefirmada (no pasan por el API). El evento `StockLow` se escribe en la tabla
`OutboxEvent`; el relay y el worker de notificaciones que lo consumirán llegan en sprints siguientes.

**Sprint 4 — pipeline base de IA: lotes e imágenes (`IA-003`, `IA-004`)**

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/v1/seller/stores/:storeId/ai/batches` | VENDEDOR | Carga masiva (1–500 imágenes): crea lote y encola el procesamiento (IA-003) |
| GET | `/api/v1/seller/stores/:storeId/ai/batches/:batchId` | VENDEDOR | Estado del lote (processed/total) |

El procesamiento ocurre **en segundo plano** con **BullMQ + Redis** (RNF-ESC-003): la petición vuelve de
inmediato. Un **proceso worker separado** (`worker-media`) consume la cola `media` y por cada imagen:
remueve el fondo (passthrough en el MVP; punto de extensión para Bria/BiRefNet — ADR-06), genera un **WebP
optimizado < 200 KB** con `sharp` (RNF-PERF-003), calcula un hash perceptual (para deduplicación, IA-005) y
sube las variantes a S3/R2/MinIO. El estado del lote avanza con cada imagen.

> El worker comparte la imagen Docker del API con distinto comando. En desarrollo se levanta aparte:
> ```bash
> pnpm --filter @gamarra/api dev          # API (productor de jobs)
> pnpm --filter @gamarra/api dev:worker   # worker-media (consumidor de la cola "media")
> ```
> En producción: `start:worker` (`node dist/workers/main.worker.js`). El API arranca aunque Redis no esté
> disponible (conexión perezosa); el worker sí requiere Redis para consumir.

**Sprint 5 — visión y generación de contenido (`IA-001`, `IA-002`, `IA-006`)**

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/v1/seller/stores/:storeId/products?status=DRAFT` | VENDEDOR | Listar borradores generados por IA (reusa el listado de productos) |
| POST | `/api/v1/seller/stores/:storeId/products/:productId/publish` | VENDEDOR | Publicar un borrador (revisión humana) |

El pipeline ahora se encadena: tras el procesamiento de imagen (cola `media`), el worker encola un job de
**visión** (cola `ai`). El **worker-ai** analiza la imagen optimizada con **Gemini** detrás del `VisionPort`,
extrae atributos (tipo de prenda, género, colores, material, estilo, temporada, corte, etiquetas SEO —
`IA-001`), genera nombre/descripción/tags comerciales (`IA-002`), y crea un **producto en borrador (DRAFT)**
con SKU automático (`IA-006`) y la media ya procesada adjunta. Emite el evento `AIDraftReady`.

- **Enrutamiento por costo/confianza (ADR-05):** cataloga con un modelo `flash-lite` económico y solo escala
  a `pro` si la confianza es baja; tolera fallos del modelo económico con degradación elegante.
- **Sin `GEMINI_API_KEY`** (dev/CI): un proveedor *stub* devuelve un borrador placeholder para que el
  pipeline completo (lote → imagen → visión → borrador) corra end-to-end sin llamar a la nube.
- **Human-in-the-loop:** ningún producto se publica solo. El vendedor revisa el borrador, fija el **precio**
  (obligatorio > 0) y publica. Si la tienda está verificada pasa a `ACTIVE`; si no, a `IN_REVIEW` (cola de
  moderación del admin, `RF-ADM-002`).

> Configura `GEMINI_API_KEY` en `.env` para usar Gemini real. Modelos en `GEMINI_MODEL_BULK` /
> `GEMINI_MODEL_ESCALATION`. El *free tier* sirve para dev/MVP; producción migra al tier pagado / Vertex AI
> (ver `docs/06-ia.md` §6.7).

**Sprint 6 — deduplicación, importación Excel y moderación (`IA-005`, `IA-007`, `RF-ADM-002`)**

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/v1/seller/stores/:storeId/ai/duplicates` | VENDEDOR | Borradores marcados como posibles duplicados (IA-005) |
| POST | `/api/v1/seller/stores/:storeId/ai/duplicates/:analysisId/resolve` | VENDEDOR | Resolver: `merge` / `update_stock` / `ignore` |
| POST | `/api/v1/seller/stores/:storeId/import/validate` | VENDEDOR | Validar filas sin crear (muestra errores antes de confirmar) |
| POST | `/api/v1/seller/stores/:storeId/import` | VENDEDOR | Importar productos masivamente (≤200 filas, IA-007) |
| GET | `/api/v1/admin/products/moderation` | ADMIN | Cola de productos en revisión (RF-ADM-002) |
| POST | `/api/v1/admin/products/moderation/:productId/approve` | ADMIN | Aprobar → ACTIVE (auditado) |
| POST | `/api/v1/admin/products/moderation/:productId/reject` | ADMIN | Rechazar → REJECTED con motivo |

- **Dedup (IA-005):** al crear un borrador, se compara el hash perceptual (aHash de 64 bits) por distancia de
  Hamming contra los productos de la tienda; si hay coincidencia se marca como posible duplicado y el
  vendedor decide fusionar, sumar stock o ignorar.
- **Importación (IA-007):** el frontend convierte el Excel a filas JSON; el backend valida fila por fila,
  reporta errores y crea borradores para las válidas. `validate` es un dry-run.
- **Moderación (RF-ADM-002):** los productos de tiendas no verificadas quedan en `IN_REVIEW`; el admin los
  aprueba o rechaza, con auditoría.

### ✅ Fase 1 (Portal de vendedores + IA) completa

Un comerciante de Gamarra puede registrarse, crear su tienda, **subir fotos y obtener productos catalogados
por IA** (atributos, copy, SKU), revisar duplicados, importar por Excel, y publicar; el admin aprueba
tiendas y modera productos. Siguiente: **Fase 2 — marketplace para compradores** (búsqueda, carrito,
checkout, pagos Yape/Plin/tarjeta).

## Ramas por sprint

Cada sprint tiene una rama-snapshot acumulativa para que puedas probar cada avance por separado:

- `sprint/0-fundaciones` — monorepo + API + módulo Galerías
- `sprint/1-identidad-acceso` — + autenticación, RBAC, sesiones
- `sprint/2-tiendas` — + onboarding de tiendas, perfil público, panel admin, auditoría
- `sprint/3-catalogo` — + productos, variantes, inventario, categorías, subida de imágenes
- `sprint/4-ia-pipeline` — + colas BullMQ, lotes de carga y worker de procesamiento de imágenes
- `sprint/5-ia-vision` — + visión Gemini, generación de copy, borradores DRAFT y publicación
- `sprint/6-ia-dedup-import` — + deduplicación, importación Excel, moderación de productos (**cierra Fase 1**)
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
