# 2. Justificación Tecnológica

El stack obligatorio definido en el encargo es sólido y coherente. Aquí justificamos cada pieza,
señalamos las decisiones de arquitectura (ADR) que **ampliamos o mejoramos** sobre el mínimo pedido,
y dejamos constancia de las alternativas evaluadas.

## 2.1 Frontend Web — Next.js 15 + TypeScript + Tailwind + shadcn/ui + React Query + Zustand

| Pieza | Por qué |
|-------|---------|
| **Next.js 15** (App Router) | SSR/ISR es **obligatorio para cumplir `RNF-PERF-001`** (LCP < 2.5 s en 4G) y SEO del marketplace. La vitrina (`storefront`) renderiza en servidor con *streaming* y *partial prerendering*; las páginas de catálogo usan ISR con revalidación de 5 min (`RNF-PERF-005`). |
| **TypeScript** | Contratos tipados extremo a extremo. El SDK de API se genera desde OpenAPI y se comparte en `packages/api-client`. |
| **TailwindCSS + shadcn/ui** | Velocidad de UI consistente entre `storefront` y `dashboard`. shadcn/ui se copia al repo (no es dependencia opaca), facilitando personalización del *design system* de Gamarra. |
| **React Query (TanStack Query)** | Estado de servidor: caché, revalidación, *optimistic updates* en carrito y stock. Reduce *boilerplate* y peticiones redundantes. |
| **Zustand** | Estado de cliente ligero (carrito invitado, filtros activos, UI). Persistencia local del carrito y favoritos sin login (`RF-CART-001`, `RF-CAT-005`). |

**Decisión propia (ADR-01):** separar **dos apps Next.js** — `storefront` (pública, optimizada para SEO y
TTFB) y `dashboard` (autenticada, panel de vendedor + admin). Razón: perfiles de carga, caché y seguridad
muy distintos; mezclarlos perjudica el LCP de la vitrina y complica el *bundle*. Comparten `packages/ui`.

## 2.2 Aplicaciones móviles — React Native + Expo + TypeScript + React Query + Zustand

| Pieza | Por qué |
|-------|---------|
| **React Native + Expo** | Un solo lenguaje (TS) y equipo para iOS/Android. Expo acelera build, OTA updates (EAS Update) y acceso a cámara (clave: el vendedor fotografía prendas), notificaciones push (`RF-SHOP-008`), y *deep links*. |
| **React Query + Zustand** | Mismos patrones que web → reutilización de lógica y del SDK de API en `packages/api-client`. |

**Decisión propia (ADR-02):** **dos apps Expo** (`mobile-buyer`, `mobile-seller`) en lugar de una con
cambio de rol. Razón: experiencias, permisos (cámara/galería del vendedor) y ciclos de publicación en las
tiendas de apps muy distintos. Comparten `packages/` (api-client, design-tokens, validators).

## 2.3 Backend — NestJS + TypeScript + PostgreSQL + Prisma + Redis

| Pieza | Por qué |
|-------|---------|
| **NestJS** | Estructura modular nativa (módulos, providers, guards, interceptors) que **encaja con el monolito modular**. DI de primera clase, soporte para microservicios futuros (`@nestjs/microservices`), generación OpenAPI (`@nestjs/swagger`). |
| **PostgreSQL 16** | Transaccional ACID para pedidos/pagos/stock. Soporta `JSONB` (atributos flexibles de IA), `pgvector` (búsqueda semántica de respaldo), particionado (logs/eventos), RLS (multi-tenant). |
| **Prisma ORM** | Esquema declarativo (`schema.prisma`) como única fuente de verdad del modelo; migraciones versionadas; tipado generado. Pedido explícitamente en el encargo. |
| **Redis 7** | Triple uso: **caché** (`RNF-PERF-005`), **colas BullMQ** (`RNF-ESC-003`) y **locks distribuidos** para reserva de stock (`RF-CART-004`). |

**Decisión propia (ADR-03):** **BullMQ** (sobre Redis) como bus de tareas asíncronas, combinado con el
**patrón Outbox** para consistencia transaccional evento↔dato. El encargo pide BullMQ y Event-Driven; el
outbox es la mejora que evita pérdida de eventos ante caídas.

**Nota Prisma (ADR-04):** las **transacciones críticas de stock y pago** se manejan con
`prisma.$transaction` + bloqueo a nivel de fila (`SELECT … FOR UPDATE` vía Prisma) o lock en Redis, para
evitar sobreventa bajo concurrencia (`RNF-PERF-004`: 1.000 compradores simultáneos).

## 2.4 IA — Google Gemini (primario) + Claude/OpenAI Vision (fallback)

| Pieza | Por qué |
|-------|---------|
| **Google Gemini Vision** (primario) | **Nivel gratuito** que abarata el MVP. Extracción estructurada de atributos de prenda con salida JSON garantizada (`responseSchema`). Familia *flash/pro* para arbitrar costo/calidad, y embeddings propios para búsqueda semántica. |
| **Claude / OpenAI Vision** (fallback) | Detrás de la misma interfaz `VisionPort`; resiliencia y mejor calidad puntual si se necesita. |

**Decisión propia (ADR-05): enrutamiento por costo y confianza.** No todas las imágenes necesitan el
modelo más capaz. Estrategia en cascada (detalle en doc 06):
1. **Bulk económico** (`gemini-2.5-flash-lite` / `2.0-flash`) para el primer pase de catalogación masiva.
2. **Escalado a modelo superior** (`gemini-2.5-flash` → `gemini-2.5-pro`) solo cuando la confianza es baja
   o el atributo es crítico.
3. **Cuota como recurso gestionado:** la cola `ai` respeta los *rate limits* del *free tier* con *back-off*;
   ante mayor volumen se migra al *tier* pagado de Gemini o a **Vertex AI** (solo configuración del puerto).
4. **Salida estructurada** (`responseSchema`) para que la respuesta siempre valide contra el esquema de producto.

> **Aviso sobre el *free tier* (detalle en doc 06 §6.7):** las cuotas gratuitas no sostienen el volumen de
> producción de `IA-003`/Año 3, y el contenido del *free tier* puede usarse para mejorar productos de Google.
> Plan: gratis en dev/MVP; *tier* pagado / Vertex AI en producción (no usa datos para entrenamiento).

**Decisión propia (ADR-06): la remoción de fondo (`IA-004`) NO la hace el LLM de visión.** Se usa un
modelo/servicio especializado (Bria RMBG, BiRefNet self-hosted en GPU, o `remove.bg`). Los LLM describen,
no segmentan píxeles con calidad de catálogo. La conversión a WebP y *thumbnails* la hace `sharp`.

## 2.5 Almacenamiento — AWS S3 o Cloudflare R2

**Recomendación: Cloudflare R2** como opción primaria. Razón: **egress gratuito**, lo que abarata
drásticamente servir millones de imágenes (`RNF-ESC-002` exige CDN). API compatible con S3, así que el
código queda agnóstico (interfaz `StoragePort`) y se puede mover a S3 sin reescribir. Se almacenan tres
variantes por foto (`IA-004`): original, sin fondo, optimizada WebP multi-resolución (`RNF-PERF-003`).

## 2.6 Búsqueda — Elasticsearch u OpenSearch

**Recomendación: OpenSearch.** Razón: licencia Apache 2.0 (sin fricción de licenciamiento de Elastic),
buen soporte de **k-NN/vectores** para búsqueda semántica y por imagen (`BÚSQUEDA INTELIGENTE`), y costo
gestionado menor en la nube. Cumple `RNF-PERF-002` (búsqueda < 500 ms, autocompletado < 200 ms) con
índices de *edge n-grams* para autocompletado y *completion suggester*.

**Decisión propia (ADR-07):** PostgreSQL es la **fuente de verdad**; OpenSearch es un **índice derivado**
mantenido por proyección de eventos (`ProductPublished`, etc.). Si OpenSearch cae, la compra sigue
funcionando (degradación elegante: *fallback* a búsqueda básica en Postgres con `pg_trgm`).

## 2.7 Infraestructura — Docker + Docker Compose + GitHub Actions

| Pieza | Por qué |
|-------|---------|
| **Docker** | Cada componente en su contenedor (`RNF-ESC-001`): portabilidad, paridad dev/staging/prod. |
| **Docker Compose** | Orquestación local y de staging simple. Define toda la topología (api, workers, postgres, redis, opensearch, minio). |
| **GitHub Actions** | CI/CD (`RNF-MANT-002`): lint, test (cobertura ≥ 90 % en pagos/auth/stock, ≥ 70 % resto — `RNF-MANT-001`), build de imágenes, deploy a staging automático y a producción con aprobación manual. |

## 2.8 Monitoreo — Sentry + Grafana + Prometheus

| Pieza | Por qué |
|-------|---------|
| **Sentry** | Errores en producción reportados solos con contexto (`RNF-MANT-004`): traza, usuario, frecuencia. |
| **Prometheus** | Métricas (latencia p95/p99, profundidad de colas, tasa de error, RPS, costo IA/imagen). |
| **Grafana** | Dashboards + alertas (`RNF-DISP-006`): si un servidor cae o el error > 1 %, alerta al equipo en < 5 min vía WhatsApp/PagerDuty. |

**Decisión propia (ADR-08):** añadir **OpenTelemetry** para trazas distribuidas (request → caso de uso →
cola → worker → proveedor externo). Imprescindible para depurar el pipeline asíncrono de IA y pagos, y para
estar listos cuando los módulos se vuelvan servicios.

## 2.9 Resumen de decisiones (ADR index)

| ADR | Decisión | Estado |
|-----|----------|--------|
| 01 | Dos apps web separadas (storefront / dashboard) | Aceptada |
| 02 | Dos apps móviles separadas (buyer / seller) | Aceptada |
| 03 | BullMQ + patrón Outbox para event-driven confiable | Aceptada |
| 04 | Locks de fila/Redis para stock bajo concurrencia | Aceptada |
| 05 | Gemini como IA primaria (free tier) + enrutamiento por costo/confianza; Claude/OpenAI como fallback | Aceptada |
| 06 | Remoción de fondo con modelo especializado, no LLM | Aceptada |
| 07 | Postgres fuente de verdad; OpenSearch índice derivado | Aceptada |
| 08 | OpenTelemetry para trazas distribuidas | Aceptada |
| 09 | Cloudflare R2 por egress gratis (mejor que S3 para imágenes) | Recomendada |
| 10 | Monorepo Turborepo + pnpm | Aceptada |
