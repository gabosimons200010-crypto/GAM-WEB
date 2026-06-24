# 1. Arquitectura Completa

## 1.1 Principios rectores

1. **MVP primero, sin hipotecar el futuro.** El portal de vendedores + IA (Fase 1) es la prioridad
   absoluta. Pero el modelo de datos, los contratos de API y los límites de módulos se diseñan hoy
   para el marketplace nacional de Año 5.
2. **Monolito modular antes que microservicios.** Para 500 tiendas (Año 1) los microservicios añaden
   costo operativo (despliegue, observabilidad distribuida, consistencia eventual) sin beneficio real.
   Construimos un monolito con **fronteras de módulo estrictas** y comunicación interna por eventos,
   de modo que cada módulo pueda extraerse a un servicio independiente cuando la escala lo justifique.
3. **Asíncrono por defecto para lo lento.** IA, imágenes, emails, WhatsApp y reportes nunca bloquean
   la petición del usuario (`RNF-ESC-003`). Van a colas BullMQ procesadas por *workers*.
4. **La IA es producto, no un adorno.** El comerciante de Gamarra sube fotos; el sistema hace casi todo
   lo demás. La arquitectura de IA es de primera clase, con su propio pipeline, presupuesto y SLAs.
5. **Tolerancia a fallos de terceros.** Si Yape o el courier caen, el resto del sitio sigue (`RNF-DISP-002`).

## 1.2 Vista de contexto (C4 — Nivel 1)

```
                         ┌───────────────────────────────────────────────┐
                         │                  GAMARRA GO                    │
                         │            (Plataforma marketplace)            │
   Comprador ───────────▶│                                               │
   (web / móvil)         │   Storefront · Dashboard · API · Workers IA   │◀─── Vendedor (web / móvil)
                         │                                               │
   Administrador ───────▶│                                               │◀─── Super Admin
                         └───────┬───────┬───────┬───────┬───────┬───────┘
                                 │       │       │       │       │
            ┌────────────────────┘       │       │       │       └──────────────────────┐
            ▼                            ▼       ▼       ▼                               ▼
   ┌─────────────────┐        ┌──────────────┐ ┌──────────┐ ┌─────────────────┐  ┌────────────────┐
   │ Yape / Plin      │        │ Culqi/Niubiz │ │ Couriers │ │ Google Gemini    │  │ WhatsApp (BSP) │
   │ (QR + webhook)   │        │ (tarjetas)   │ │ (envíos) │ │ Vision (IA)*     │  │ + Email (SES)  │
   └─────────────────┘        └──────────────┘ └──────────┘ └─────────────────┘  └────────────────┘
                                       │                              │
                                       ▼                              ▼
                              ┌──────────────┐              ┌──────────────────┐
                              │ SUNAT / OSE  │              │ Remoción fondo    │
                              │ (boleta/fac) │              │ (Bria/BiRefNet)   │
                              └──────────────┘              └──────────────────┘
```

**Actores:** Comprador, Vendedor (dueño de tienda), Administrador, Super Admin.
**Sistemas externos:** pasarelas Yape/Plin/Culqi/Niubiz, couriers, proveedor de IA primario Google Gemini
Vision (*free tier*; Claude/OpenAI Vision como fallback opcional —marcado con `*`),
servicio de remoción de fondo, WhatsApp BSP (p.ej. Twilio/Meta Cloud API), email (AWS SES), OSE/SUNAT
para comprobantes electrónicos.

## 1.3 Vista de contenedores (C4 — Nivel 2)

```
┌──────────────────────────── Cliente ────────────────────────────┐
│  storefront (Next.js 15, SSR/ISR)   mobile-buyer (Expo)          │
│  dashboard  (Next.js 15, SPA auth)  mobile-seller (Expo)         │
└───────────────┬──────────────────────────────┬──────────────────┘
                │ HTTPS / REST (JSON)           │ HTTPS / REST
                ▼                               ▼
        ┌───────────────────────────────────────────────┐
        │                API Gateway (NestJS)            │   ← BFF + REST público versionado
        │  Auth · Rate limit · Validación · OpenAPI      │
        └───────┬───────────────────────────────┬───────┘
                │  (in-process, eventos)         │
   ┌────────────▼─────────────┐        ┌─────────▼──────────┐
   │   Monolito Modular        │        │  Outbox + Event Bus │
   │  (Bounded Contexts)       │───────▶│  (tabla outbox →    │
   │  Identity, Catalog,       │        │   BullMQ / Redis)   │
   │  Orders, Payments, …      │        └─────────┬──────────┘
   └───┬──────────┬───────┬────┘                  │
       │          │       │                       ▼
       ▼          ▼       ▼              ┌──────────────────────┐
  ┌─────────┐ ┌───────┐ ┌──────────┐    │   Workers (procesos)  │
  │Postgres │ │ Redis │ │OpenSearch│    │  ai · images · mailer │
  │(Prisma) │ │(cache)│ │(búsqueda)│    │  whatsapp · reports   │
  └─────────┘ └───────┘ └──────────┘    │  payments-recon       │
       │                                └──────────┬───────────┘
       ▼                                           ▼
  ┌─────────────────┐                     ┌──────────────────┐
  │ S3 / Cloudflare  │◀────── CDN ────────▶│ Proveedores IA /  │
  │ R2 (originales,  │                     │ remoción fondo    │
  │ WebP, sin fondo) │                     └──────────────────┘
  └─────────────────┘
```

**Contenedores desplegables:**

| Contenedor | Tecnología | Responsabilidad | Escala |
|------------|-----------|-----------------|--------|
| `storefront` | Next.js 15 | Vitrina compradores, SEO, SSR/ISR | Horizontal (stateless) |
| `dashboard` | Next.js 15 | Panel vendedor + panel admin | Horizontal (stateless) |
| `api` | NestJS | REST público + lógica de dominio | Horizontal (stateless) |
| `worker-ai` | NestJS (worker) | Pipeline de catalogación IA | Horizontal por cola |
| `worker-media` | NestJS (worker) | Remoción de fondo, WebP, thumbnails | Horizontal (CPU/GPU) |
| `worker-notify` | NestJS (worker) | Email, WhatsApp, push | Horizontal |
| `worker-ops` | NestJS (worker) | Reportes, liquidaciones, reindex búsqueda | Horizontal |
| `postgres` | PostgreSQL 16 | Persistencia transaccional (fuente de verdad) | Vertical + réplica lectura |
| `redis` | Redis 7 | Caché, colas BullMQ, sesiones, locks de stock | Cluster cuando aplique |
| `opensearch` | OpenSearch | Búsqueda léxica/semántica/imagen | Cluster |

Las apps móviles y web son **clientes** del mismo `api`. No hay BFF separado por cliente en MVP; el
gateway NestJS expone un REST consistente. Si más adelante un cliente necesita agregación específica,
se añade un BFF sin tocar el dominio.

## 1.4 Estilo arquitectónico interno: Monolito Modular Event-Driven

Dentro del contenedor `api` aplicamos **arquitectura hexagonal por bounded context**:

```
módulo (p.ej. catalog/)
├── domain/          ← entidades, value objects, reglas de negocio puras (sin frameworks)
├── application/     ← casos de uso (command/query handlers), puertos (interfaces)
├── infrastructure/  ← adaptadores: Prisma repos, clientes HTTP, publicadores de eventos
└── interface/       ← controladores REST, DTOs, mapeadores, OpenAPI
```

**Reglas de frontera (las que hacen extraíble el monolito):**

- Un módulo **nunca** importa los repositorios Prisma de otro módulo. Se comunican por:
  1. **Llamadas a casos de uso públicos** del otro módulo (síncrono, dentro del proceso), o
  2. **Eventos de dominio** (asíncrono), vía outbox.
- Cada módulo es "dueño" de sus tablas. No hay JOINs entre tablas de módulos distintos en código de
  aplicación; si se necesita data de otro contexto, se pide por su API o se mantiene una proyección.
- Las claves foráneas cross-módulo existen a nivel de BD (integridad) pero el acceso lógico pasa por el dueño.

### Patrón Outbox + Event Bus

Para garantizar consistencia entre el cambio transaccional y la publicación del evento (`RNF-DISP`),
escribimos el evento en una tabla `OutboxEvent` **dentro de la misma transacción** que el cambio de
negocio. Un *relay* lee la outbox y publica a BullMQ. Esto evita el problema de "dual write" (guardar en
BD y fallar al publicar, o viceversa).

```
[Caso de uso] --tx--> (cambia Order + inserta OutboxEvent)  COMMIT
                                   │
                    [Relay outbox] lee filas no publicadas
                                   │
                            publica a BullMQ (Redis)
                                   │
        ┌──────────────┬──────────┴───────────┬──────────────┐
        ▼              ▼                      ▼              ▼
   worker-notify   worker-ops          worker-ai      (proyección
   (WhatsApp)      (liquidación)       (re-embed)      OpenSearch)
```

Eventos de dominio principales: `StoreApproved`, `ProductPublished`, `ProductImagesUploaded`,
`AIDraftReady`, `OrderPlaced`, `OrderPaid`, `OrderStatusChanged`, `PaymentConfirmed`, `RefundIssued`,
`ReviewSubmitted`, `StockLow`, `CouponRedeemed`.

## 1.5 Multi-tenancy (aislamiento por tienda)

El requisito `RF-AUTH-006` exige que *"un vendedor no puede ver los pedidos de otra tienda"*.

- **Estrategia:** *shared database, shared schema* con `storeId` como discriminador y aislamiento
  forzado en la capa de aplicación + RLS (Row Level Security) opcional en PostgreSQL como segunda barrera.
- Todo repositorio de datos de tienda recibe el `storeId` del contexto de seguridad (extraído del JWT y
  la membresía), nunca del payload del cliente. Un *guard* y un *interceptor* de NestJS inyectan y validan
  el `tenant scope` en cada request de vendedor.
- El admin/super-admin opera con un scope "global" auditado (`RF-ADM-006`, `AuditLog`).

## 1.6 Vista de despliegue (resumen; detalle en doc 07)

```
Internet ─▶ CDN (Cloudflare/CloudFront) ─▶ Load Balancer ─▶ {storefront, dashboard, api} (N réplicas)
                                                                      │
                          ┌───────────────────────────────────────────┼───────────────┐
                          ▼                          ▼                 ▼               ▼
                     Postgres (primary           Redis            OpenSearch       Object Storage
                     + read replica)            (cache/cola)       (cluster)        (S3 / R2) + CDN
                          ▲
                    Workers (ai, media, notify, ops) — escalan por profundidad de cola
```

Todo corre en contenedores Docker (`RNF-ESC-001`), orquestados en MVP con Docker Compose / un PaaS de
contenedores (ECS Fargate, Render, Railway o similar), con ruta de migración a Kubernetes documentada
en el doc 08.

## 1.7 Flujos críticos (resumen)

**A. Catalogación por IA (el flujo estrella — IA-001…IA-006):**
```
Vendedor sube N fotos ─▶ api crea AIBatch + sube originales a S3 ─▶ evento ProductImagesUploaded
   ─▶ worker-media (remueve fondo, genera WebP/thumbnails) ─▶ worker-ai (visión: atributos + copy + SKU
   + embeddings + dedupe) ─▶ crea Product en estado DRAFT ─▶ notifica al vendedor para revisar/publicar.
```

**B. Checkout multi-tienda (RF-CART-002, RF-PAY-001):**
```
Carrito (agrupado por tienda) ─▶ valida stock (RF-CART-003) + reserva 15 min (RF-CART-004)
   ─▶ calcula envío por tienda (RF-CART-005) ─▶ crea Order + N SubOrders (una por tienda)
   ─▶ genera pago único (Yape QR / tarjeta) ─▶ webhook confirma ─▶ OrderPaid
   ─▶ emite comprobante (RF-PAY-008) + notifica (RF-ORD-002) + libera/confirma stock.
```

Ambos flujos se detallan con diagramas de secuencia en los docs 05 (APIs) y 06 (IA).
