# 12. Plan de Implementación Paso a Paso

> Este plan se ejecuta **después de aprobar la arquitectura**. Está organizado en sprints de 2 semanas.
> El foco es **Fase 1 (MVP: portal de vendedores + IA)**, que es la prioridad absoluta del encargo.

## 12.1 Equipo sugerido (mínimo viable)

| Rol | Responsabilidad |
|-----|-----------------|
| Tech Lead / Arquitecto | Fronteras de módulos, contratos, revisión técnica |
| 2 Backend (NestJS) | Dominio, APIs, workers, IA, pagos |
| 2 Frontend (Next.js) | storefront + dashboard |
| 1 Mobile (Expo) | Apps (entra en Fase 3; antes apoya web) |
| 1 DevOps/SRE | Infra, CI/CD, observabilidad |
| 1 QA | Pruebas, cobertura, e2e |
| 1 PO/Diseño | Priorización, UX del onboarding del vendedor |

## 12.2 Definición de "Hecho" (DoD)

Una historia está hecha cuando: cumple criterios de aceptación + tests (cobertura según `RNF-MANT-001`) +
pasa CI + documentada en OpenAPI (si es API) + revisada + desplegada en staging + sin issues de seguridad
abiertas.

## 12.3 Sprint 0 — Fundaciones (2 semanas)

1. Monorepo Turborepo + pnpm; `packages/config` (eslint, tsconfig, tailwind).
2. `apps/api` NestJS esqueleto; estructura hexagonal por módulo; healthcheck.
3. `schema.prisma` inicial (doc 04); migración base; `seed` de roles/permisos/categorías/galerías.
4. `docker-compose` con postgres, redis, opensearch, minio.
5. CI/CD GitHub Actions: lint, typecheck, test, build; deploy a staging.
6. Observabilidad base: Sentry, Prometheus/Grafana, OpenTelemetry collector.
7. `packages/contracts` con eventos v1; outbox + relay + BullMQ esqueleto.

**Salida:** "hello world" desplegado en staging por CI; migración y semilla corriendo; pipeline verde.

## 12.4 Sprint 1 — Identidad y acceso (`RF-AUTH`)

1. Registro email (`RF-AUTH-001`) y celular OTP (`RF-AUTH-002`); verificación.
2. Login con bloqueo tras 5 intentos (`RF-AUTH-007`); JWT access + refresh rotativo HttpOnly (`RNF-SEC-003`).
3. Logout server-side (`RF-AUTH-005`); recuperación de contraseña (`RF-AUTH-004`).
4. RBAC: roles y permisos, guards, scope multi-tenant (`RF-AUTH-006`).
5. 2FA admin (`RF-AUTH-008`); rate limiting (`RNF-SEC-006`); bcrypt(12) (`RNF-SEC-002`).
6. OAuth social (`RF-AUTH-003`) tras feature flag (P2).

**Salida:** un usuario se registra, inicia y cierra sesión; admin con 2FA; tests de autorización por tenant.

## 12.5 Sprint 2 — Tiendas y Gamarra (`RF-SHOP-001`, MÓDULO GAMARRA)

1. Entidad `Gallery` + CRUD admin; carga de galerías reales de Gamarra.
2. Onboarding de tienda en 3 pasos (`RF-SHOP-001`): datos, categorías/galería/stand, logo/banner → IN_REVIEW.
3. Configuración de tienda (`RF-SHOP-010`): horario, días de preparación, política, umbral de stock.
4. Panel admin: listar/aprobar/verificar/suspender tiendas (`RF-ADM-001`) + `AuditLog` (`RF-ADM-006`).

**Salida:** una tienda se registra y un admin la aprueba; queda visible su perfil.

## 12.6 Sprint 3 — Catálogo e inventario (`RF-SHOP-003/005`)

1. Categorías (taxonomía) y árbol.
2. CRUD de productos + archivar (`RF-SHOP-003`), variantes talla/color con `Inventory`.
3. Alertas de stock bajo (`RF-SHOP-005`) vía evento `StockLow` + notificación.
4. Subida de imágenes a S3/R2 con URLs prefirmadas; validación de archivos (`RNF-SEC-007`).

**Salida:** un vendedor crea productos manualmente con variantes y stock.

## 12.7 Sprints 4–6 — IA de catalogación (el núcleo, `IA-001…007`)

**Sprint 4 — Pipeline base e imágenes (IA-004):**
1. `worker-media`: remoción de fondo (modelo especializado) + WebP/thumbnails con `sharp`; 3 variantes en
   `ProductMedia`; < 200 KB (`RNF-PERF-003`).
2. `AIBatch` + carga masiva (`IA-003`): subida directa, jobs en cola `ai`, progreso `processed/total`.

**Sprint 5 — Visión y contenido (IA-001/002/006):**
3. `VisionPort` multi-proveedor (Claude/OpenAI) con structured outputs; extracción de atributos (`IA-001`).
4. Generación de copy comercial (`IA-002`); SKU automático (`IA-006`).
5. Enrutamiento por costo/confianza + Batch API; telemetría `costUsd`.
6. Creación de `Product` DRAFT + evento `AIDraftReady` + notificación; revisión/edición/publicación
   (human-in-the-loop).

**Sprint 6 — Dedupe e importación (IA-005/007):**
7. pHash + embedding; detección de duplicados con sugerencia fusionar/stock/ignorar (`IA-005`).
8. Importación Excel (`IA-007`): plantilla, validación por fila (máx. 200), relación con imágenes.
9. Cola de moderación de productos para tiendas no verificadas (`RF-ADM-002`).

**Salida Fase 1:** un vendedor sube fotos y obtiene productos publicables; admin modera; métricas de IA y
costo en Grafana. **Fin del MVP.**

## 12.8 Sprints 7–12 — Fase 2 (marketplace comprador)

| Sprint | Foco |
|--------|------|
| 7 | Búsqueda OpenSearch: indexación por eventos, filtros (`RF-CAT-002`), autocompletado (`RNF-PERF-002`), ordenamiento (`RF-CAT-008`) |
| 8 | Búsqueda semántica + por imagen (embeddings k-NN); vitrina/home y página de categoría/producto/tienda |
| 9 | Carrito multi-tienda persistente, validación + reserva de stock, cálculo de envío, cupones (`RF-CART`) |
| 10 | Checkout (Order+SubOrder, reserva 15m), Yape/Plin QR+webhook idempotente (`RF-PAY-001/002`) |
| 11 | Tarjeta Culqi/Niubiz + 3DS (`RF-PAY-003`), comprobante electrónico (`RF-PAY-008`), pagos fallidos claros |
| 12 | Pedidos y postventa: estados, notificaciones, seguimiento público, cancelación, devoluciones, reseñas (`RF-ORD`) |

**Salida Fase 2:** compra end-to-end con Yape; NFR de performance verificados; prueba de carga 1.000
concurrentes.

## 12.9 Fases 3–5 (resumen)

- **Fase 3:** `mobile-buyer` y `mobile-seller` (Expo), reutilizando `api-client`; cámara→IA; push.
- **Fase 4:** operación de logística propia (modelo `Shipping` ya listo); piloto por zona.
- **Fase 5:** recomendaciones, IA avanzada (pricing, calidad de foto), antifraude.

## 12.10 Hitos y control

- **Demo quincenal** al final de cada sprint en staging.
- **Gate de cobertura** en CI (90 % pagos/auth/stock; 70 % resto) — bloqueante.
- **Escaneo de seguridad** antes de cada release a producción (`RNF-SEC-008`).
- **Pruebas de carga** antes de Fase 2 GA y antes de campañas (`RNF-PERF-004`).
- **Runbook de DR** probado antes de producción (`RNF-DISP-004/005`).

## 12.11 Pre-requisitos antes de codificar (qué necesitamos del negocio)

1. Cuentas/sandbox de **Yape, Plin, Culqi/Niubiz** y proveedor **OSE** para comprobantes.
2. Claves de **proveedores de IA** (Claude/OpenAI) y, si se self-hostea remoción de fondo, GPU.
3. **WhatsApp BSP** (Twilio/Meta Cloud API) y dominio + correo (SES).
4. Datos reales de **galerías de Gamarra** y taxonomía de categorías de ropa.
5. Definición de **comisión** de plataforma y reglas de **liquidación** (`RF-PAY-007`).
6. Términos, política de privacidad, libro de reclamaciones (footer legal).

---

**Listo para revisión.** Una vez aprobada esta arquitectura, se inicia el Sprint 0. No se ha escrito código
de aplicación todavía, conforme a la regla principal del encargo.
