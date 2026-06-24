# 9. Riesgos Técnicos y Mitigaciones

Registro de riesgos priorizado por impacto × probabilidad. Cada riesgo enlaza a la decisión de arquitectura
que lo aborda.

## 9.1 Riesgos de producto / IA

| # | Riesgo | Impacto | Prob. | Mitigación |
|---|--------|---------|-------|------------|
| R-01 | **Límite de cuota / costo de IA** — el *free tier* de Gemini no sostiene cargas masivas (500 fotos × cientos de tiendas) y produce HTTP 429 | Alto | Alta | Cola con *back-off* y concurrencia limitada; enrutamiento a modelos *flash-lite* (ADR-05); telemetría de cuota/costo en Grafana; **plan de migración a Gemini pagado / Vertex AI** cuando el volumen lo exija (solo config del puerto) |
| R-01b | **Privacidad del *free tier*** — el contenido enviado puede usarse para entrenar productos de Google | Medio | Alta | *Free tier* solo en dev/MVP; producción en *tier* pagado / Vertex AI (no usan datos para entrenamiento); avisar a tiendas en términos |
| R-02 | **Calidad de catalogación insuficiente** (atributos errados) frustra al vendedor | Alto | Media | Human-in-the-loop obligatorio (borradores), structured outputs contra taxonomía fija, métricas de tasa de corrección, ajuste iterativo de prompts |
| R-03 | **Remoción de fondo de baja calidad** si se delega al LLM | Medio | Alta | Modelo especializado (Bria/BiRefNet), no el LLM (ADR-06); revisión visual en el borrador |
| R-04 | **Dependencia de un único proveedor de IA** (Gemini: caída, cambio de cuota/precio, rate limit) | Alto | Media | Abstracción `VisionPort` con fallback a Claude/OpenAI, conmutación con *backoff*, idempotencia por `imageHash` |
| R-05 | **Dedupe falla** y se publican productos repetidos | Bajo | Media | pHash + embedding + sugerencia (no auto-merge), el vendedor decide (IA-005) |

## 9.2 Riesgos de transacciones / pagos

| # | Riesgo | Impacto | Prob. | Mitigación |
|---|--------|---------|-------|------------|
| R-06 | **Sobreventa** bajo concurrencia (1.000 compradores) | Alto | Media | Bloqueo de fila (`FOR UPDATE`) + reserva 15 min + descuento atómico al confirmar pago (ADR-04, doc 04 §4.4) |
| R-07 | **Webhook de pago duplicado o perdido** | Alto | Media | Idempotencia `(provider, externalId)`, respuesta 200 rápida + proceso async, reconciliación periódica (worker-ops) |
| R-08 | **Inconsistencia evento↔dato** (dual write) | Alto | Media | Patrón Outbox transaccional (ADR-03) |
| R-09 | **Checkout multi-tienda complejo** (estados parciales por tienda) | Medio | Alta | Modelo `Order`+`SubOrder` con máquina de estados por suborden; pago único, liquidación por tienda |
| R-10 | **Fraude / contracargos** en tarjeta | Medio | Media | 3DS obligatorio, PAN fuera de nuestro alcance (PCI del proveedor), reglas de riesgo, auditoría |
| R-11 | **Errores de comprobante electrónico** (SUNAT/OSE) | Medio | Media | Emisión async con reintentos, guardado de XML, conciliación; el pedido no se bloquea por el comprobante |

## 9.3 Riesgos de rendimiento / disponibilidad

| # | Riesgo | Impacto | Prob. | Mitigación |
|---|--------|---------|-------|------------|
| R-12 | **No cumplir LCP < 2.5 s** en 4G | Medio | Media | SSR/ISR, CDN, WebP < 200 KB, presupuesto de performance en CI (Lighthouse) |
| R-13 | **OpenSearch como punto único** de búsqueda | Medio | Media | Índice derivado reconstruible + fallback `pg_trgm` (degradación elegante) |
| R-14 | **Backlog de colas** en picos (campañas tipo "Cyber Gamarra") | Medio | Media | Auto-scaling de workers por lag de cola, prioridades, DLQ, pruebas de carga previas a campañas |
| R-15 | **Pérdida de datos** ante desastre | Alto | Baja | Backups horarios fuera de sitio (RPO<1h), PITR, réplica promovible (RTO<1h), runbook probado |
| R-16 | **Caída de tercero** tumba el sitio | Alto | Media | Circuit breakers, timeouts, bulkheads, fallback de métodos/servicios (`RNF-DISP-002`) |

## 9.4 Riesgos de seguridad

| # | Riesgo | Impacto | Prob. | Mitigación |
|---|--------|---------|-------|------------|
| R-17 | **Fuga entre tiendas** (vendedor ve datos de otra) | Alto | Media | Scope multi-tenant forzado en capa de app + RLS opcional, tests de autorización (ADR multi-tenant) |
| R-18 | **XSS / SQLi / CSRF** | Alto | Media | Sanitización, ORM parametrizado, tokens CSRF, SameSite, SAST/DAST en CI (`RNF-SEC-004/008`) |
| R-19 | **Fuerza bruta / credential stuffing** | Medio | Alta | Rate limiting, bloqueo tras 5 intentos, 2FA admin, hashing bcrypt(12) |
| R-20 | **Archivos maliciosos** subidos por vendedores | Medio | Media | Validación de tipo real, almacenamiento fuera del web root, escaneo, límites de tamaño (`RNF-SEC-007`) |
| R-21 | **Filtración de secretos** (claves de pasarelas/IA) | Alto | Baja | Gestor de secretos por entorno, rotación, nunca en repo |

## 9.5 Riesgos de proyecto / adopción

| # | Riesgo | Impacto | Prob. | Mitigación |
|---|--------|---------|-------|------------|
| R-22 | **Adopción del vendedor de Gamarra** (baja alfabetización digital) | Alto | Alta | La IA hace casi todo; onboarding en 3 pasos; app móvil con cámara; soporte por WhatsApp |
| R-23 | **Alcance excesivo del MVP** | Alto | Alta | Priorización P1>P2>P3>P4; feature flags; roadmap por fases (doc 10) |
| R-24 | **Acoplamiento accidental entre módulos** que impide extraer microservicios | Medio | Media | Reglas de frontera estrictas, lint de dependencias entre módulos, contratos versionados |
| R-25 | **Deuda en pruebas** de módulos críticos | Medio | Media | Gate de cobertura en CI (90 % pagos/auth/stock), tests de contrato de eventos |

## 9.6 Top 5 a vigilar desde el día 1

1. **R-01 Costo de IA** — define la viabilidad económica del núcleo.
2. **R-06 Sobreventa** — daño directo a confianza y a tiendas.
3. **R-07 Webhooks de pago** — dinero real; idempotencia no negociable.
4. **R-17 Aislamiento multi-tenant** — un fallo aquí es crítico de seguridad.
5. **R-22 Adopción del vendedor** — sin tiendas no hay marketplace.
