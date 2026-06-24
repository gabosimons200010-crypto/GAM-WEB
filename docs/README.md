# GAMARRA GO — Dossier de Arquitectura Empresarial y Técnica

> **Estado: PROPUESTA PARA REVISIÓN. No se ha escrito código de aplicación todavía.**
> Este repositorio contiene el diseño completo de arquitectura previo a la implementación,
> según la regla principal del encargo: *primero diseñar, luego construir*.

GAMARRA GO es un marketplace multi-tienda de prendas de vestir provenientes de las galerías
y puestos del emporio comercial de Gamarra (Lima, Perú). Inspirado en Rappi y Mercado Libre,
su núcleo diferenciador es un **sistema de IA que cataloga productos automáticamente** a partir
de fotografías, eliminando la barrera técnica para comerciantes sin conocimientos digitales.

## Documento como fuente de verdad

El PDF *"Componentes y partes de la página / Requerimientos"* es la **fuente de verdad**.
Donde el prompt original y el documento difieren, prevalece el documento. Los requerimientos
funcionales (`RF-XXX-000`) y no funcionales (`RNF-XXX-000`) con sus prioridades **P1–P4**
provienen de ese documento y son la base de trazabilidad de todo este diseño.

| Prioridad | Significado | Implicancia de arquitectura |
|-----------|-------------|------------------------------|
| **P1** | No negociable — sin esto no hay lanzamiento | Entra en MVP, con pruebas y monitoreo desde el día 1 |
| **P2** | Importante — máximo 2 semanas post-lanzamiento | Diseñado en MVP, activable por feature flag |
| **P3** | Deseable — puede esperar 1–2 versiones | Modelado en datos/contratos, implementado luego |
| **P4** | Algún día | Solo se reserva espacio en el diseño |

## Índice de entregables

El orden sigue exactamente lo solicitado en *ENTREGA ESPERADA*:

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [01 — Arquitectura completa](./01-arquitectura.md) | Vista C4, estilo arquitectónico (monolito modular event-driven), límites de contexto |
| 2 | [02 — Justificación tecnológica](./02-justificacion-tecnologica.md) | Por qué cada tecnología obligatoria, decisiones (ADR) y alternativas descartadas |
| 3 | [03 — Diagrama de módulos](./03-diagrama-modulos.md) | Bounded contexts, dependencias, eventos de dominio |
| 4 | [04 — Modelo de datos (Prisma)](./04-modelo-datos.md) | Esquema Prisma completo, índices, multi-tenancy, decisiones de modelado |
| 5 | [05 — Diseño de APIs](./05-apis.md) | REST + OpenAPI, DTOs, casos de uso, versionado, contratos de webhooks |
| 6 | [06 — Estrategia de IA](./06-ia.md) | Pipeline IA-001…IA-007, modelos, costos, colas, human-in-the-loop |
| 7 | [07 — Infraestructura](./07-infraestructura.md) | Docker, entornos, CI/CD, observabilidad, red, secretos |
| 8 | [08 — Escalabilidad](./08-escalabilidad.md) | Plan año 1/3/5, caché, búsqueda, workers, ruta a microservicios/k8s |
| 9 | [09 — Riesgos técnicos](./09-riesgos.md) | Registro de riesgos, impacto, mitigaciones |
| 10 | [10 — Roadmap](./10-roadmap.md) | Fases 1–5 detalladas con épicas y criterios de salida |
| 11 | [11 — Estructura de carpetas](./11-estructura-carpetas.md) | Monorepo, convenciones, organización de apps y packages |
| 12 | [12 — Plan de implementación](./12-plan-implementacion.md) | Sprints paso a paso, equipo, definición de "hecho" |

## Resumen ejecutivo (TL;DR)

- **Estilo:** Monorepo (Turborepo + pnpm) con un **monolito modular NestJS** internamente
  *event-driven* (patrón outbox + BullMQ), diseñado para extraerse a microservicios sin reescribir.
  Es la opción correcta para 500 tiendas en Año 1 evitando el sobrecosto operativo de microservicios prematuros.
- **Apps:** `storefront` (Next.js, SSR/SEO para compradores), `dashboard` (Next.js, panel vendedor + admin),
  `mobile-buyer` y `mobile-seller` (Expo/React Native). Comparten `packages/` (SDK de API tipado, tipos, UI, config).
- **Datos:** PostgreSQL + Prisma, Redis (caché + colas), OpenSearch (búsqueda léxica + semántica + por imagen),
  S3/Cloudflare R2 (imágenes), todo servido por CDN.
- **IA (el núcleo):** pipeline asíncrono de visión que extrae atributos estructurados, genera copy comercial,
  quita fondo, deduplica y crea borradores de producto. Proveedor primario **Google Gemini** (*free tier*
  para el MVP; Claude/OpenAI Vision como fallback), enrutado por costo: bulk con modelos *flash* económicos
  + escalado a modelos superiores ante baja confianza, con **revisión humana** obligatoria antes de publicar.
  Nota: el *free tier* cubre dev/MVP; producción migra al *tier* pagado/Vertex AI (ver doc 06 §6.7).
- **Pagos:** Yape y Plin (QR dinámico + webhook), tarjetas vía Culqi/Niubiz (3DS, PCI fuera de nuestro alcance),
  carrito multi-tienda con pago único y división de liquidaciones.
- **No funcionales clave:** LCP < 2.5 s, búsqueda < 500 ms, autocompletado < 200 ms, disponibilidad 99.5 %,
  RTO < 1 h, RPO < 1 h, JWT con refresh rotativo en cookies HttpOnly, bcrypt(12), rate limiting.

## Trazabilidad

Cada decisión de este dossier referencia los IDs de requerimiento del documento fuente
(`RF-AUTH-001`, `RNF-PERF-001`, etc.). La matriz de trazabilidad completa está en el
[Roadmap](./10-roadmap.md#matriz-de-trazabilidad).
