# 8. Estrategia de Escalabilidad

## 8.1 Objetivos de crecimiento

| Hito | Tiendas | Productos | Implicancia |
|------|---------|-----------|-------------|
| **Año 1** | 500 | 100.000 | Monolito modular + workers; 1.000 compradores concurrentes (`RNF-PERF-004`) |
| **Año 3** | 5.000 | 1.000.000 | Réplicas de lectura, OpenSearch en cluster, sharding de colas, posible extracción de módulos calientes |
| **Año 5** | Nacional | Decenas de millones | Microservicios selectivos, Kubernetes, multi-AZ, particionado de datos |

El diseño no se reescribe entre hitos: **escala por capas**, activando lo necesario cuando las métricas lo
exigen, no antes.

## 8.2 Rendimiento (cómo se cumplen los NFR)

| Requerimiento | Mecanismo |
|---------------|-----------|
| Home < 2.5 s LCP en 4G (`RNF-PERF-001`) | SSR/ISR Next.js, CDN, WebP < 200 KB, *code splitting*, ISR 5 min en catálogo |
| Búsqueda < 500 ms (`RNF-PERF-002`) | OpenSearch dedicado, índices ajustados |
| Autocompletado < 200 ms (`RNF-PERF-002`) | *completion suggester* / edge n-grams en memoria |
| Imágenes WebP, CDN (`RNF-PERF-003`, `RNF-ESC-002`) | `sharp` + R2/S3 + CDN edge |
| Caché (`RNF-PERF-005`) | Redis: catálogo por categoría 5 min, producto 30 s (stock fresco) |

## 8.3 Caché en capas

```
Navegador (cache-control / SWR React Query)
   └─▶ CDN edge (HTML ISR, imágenes, estáticos)
          └─▶ Redis (listados de categoría 5 min; producto 30 s; sesiones; autocompletado)
                 └─▶ PostgreSQL (fuente de verdad)
```

Invalidación dirigida por eventos: `ProductPublished`/`StockChanged` purgan las claves afectadas y
revalidan ISR. Stock con TTL corto (30 s) para no mostrar disponibilidad falsa.

## 8.4 Procesamiento asíncrono (`RNF-ESC-003`)

Tareas lentas nunca bloquean la respuesta: van a colas BullMQ y las procesan workers.

| Cola | Trabajos | Worker | Escala por |
|------|----------|--------|------------|
| `ai` | análisis de visión, copy, embeddings, dedupe | worker-ai | profundidad de cola, rate limit proveedor |
| `media` | remoción de fondo, WebP, thumbnails | worker-media | CPU/GPU |
| `notify` | email, WhatsApp, push | worker-notify | volumen de notificaciones |
| `ops` | reportes, liquidaciones, reindex, limpieza de reservas | worker-ops | cron + lotes |
| `outbox-relay` | publicar eventos de la outbox | (parte de api/ops) | constante |

Colas con **prioridad, reintentos con backoff, DLQ** (dead-letter) y *rate limiting* por proveedor.

## 8.5 Base de datos a escala

- **Año 1:** una primaria + una réplica de lectura. Lecturas de catálogo/búsqueda van a réplica o a
  OpenSearch; escrituras transaccionales a primaria.
- **Año 3:** múltiples réplicas de lectura; **particionado** de tablas de alto volumen
  (`OrderStatusHistory`, `AuditLog`, `OutboxEvent`, `PaymentWebhookEvent`) por fecha; *connection pooling*
  (PgBouncer).
- **Año 5:** considerar separación física de datos por bounded context (cada microservicio extraído lleva
  sus tablas), y particionado/citus o sharding por `storeId`/región si el volumen lo exige.

## 8.6 Búsqueda a escala

OpenSearch como cluster con réplicas e índices por tipo (productos, tiendas, sugerencias). Reindexación
*online* mediante reproyección de eventos. El embedding híbrido (BM25 + k-NN) escala horizontalmente con
nodos de datos. Fallback a `pg_trgm` si el cluster degrada.

## 8.7 Auto-scaling (`RNF-ESC-004`)

- **Apps stateless** (`storefront`, `dashboard`, `api`): escala horizontal por CPU/RPS. Regla base: si CPU
  > 70 % por 3 min ⇒ +1 instancia; si CPU < 30 % ⇒ −1 (`RNF-ESC-004`).
- **Workers:** escalan por *lag* de cola (p.ej. KEDA con métrica de longitud de BullMQ), independientes del
  tráfico web. Las cargas de IA masivas escalan worker-ai sin afectar la vitrina.

## 8.8 Ruta a microservicios y Kubernetes (preparada, no prematura)

El monolito ya está dividido en bounded contexts con comunicación por eventos, lo que hace la extracción
mecánica:

```
Disparador de extracción (métricas): un módulo se vuelve cuello de botella, tiene
escalado/seguridad/equipo distinto, o su despliegue frecuente arriesga al resto.

Orden probable de extracción:
  1. AI Cataloging  → cargas masivas, GPU, costo y escalado propio
  2. Search         → ya es un servicio derivado de facto
  3. Payments       → seguridad/PCI y cadencia de cambios distinta
  4. Notifications  → puramente reactivo, fácil de aislar
```

Pasos de extracción: el módulo conserva sus tablas → su comunicación in-process se reemplaza por el mismo
contrato de eventos (ahora sobre NATS/Kafka en vez de BullMQ in-process) → se despliega como servicio
independiente en **Kubernetes**. El contrato no cambia porque ya estaba versionado en `packages/contracts`.

**Kubernetes (Año 3–5):** HPA por CPU/RPS, KEDA por colas, despliegues *blue/green*/canary, multi-AZ para
alta disponibilidad, *service mesh* opcional para mTLS y trazas. El paso de Docker Compose a manifiestos k8s
es directo porque ya todo es contenedor sin estado local.

## 8.9 Tolerancia a fallos (`RNF-DISP-002`)

- Pasarela de pago caída ⇒ el comprador usa otro método; el carrito permanece intacto (`RF-PAY-005`).
- Courier sin respuesta ⇒ el pedido se crea igual y el costo de envío se recalcula al volver el servicio.
- OpenSearch caído ⇒ búsqueda básica en Postgres.
- Proveedor de IA caído ⇒ conmuta a alterno; los borradores se generan cuando vuelve.
- *Circuit breakers* y *timeouts* en todos los clientes de terceros; *bulkheads* por cola para que una
  saturación no contagie a otras.
