# 10. Roadmap Detallado

Cinco fases alineadas con el encargo. Cada fase tiene épicas, criterios de salida y los requerimientos
(`RF/RNF`) que cierra. La prioridad **P1** del documento manda dentro de cada fase.

## Fase 1 — Portal de vendedores + IA (MVP, prioridad absoluta)

**Objetivo:** que un comerciante registre su tienda, suba fotos y obtenga productos catalogados por IA,
listos para vender; con panel admin para aprobar y moderar.

| Épica | Entregables | Requerimientos |
|-------|-------------|----------------|
| Identidad y acceso | Registro email/celular (OTP), login, roles, recuperación, logout server-side, 2FA admin | RF-AUTH-001/002/004/005/006/008 |
| Onboarding de tienda | Registro en 3 pasos, RUC/razón social, galería/piso/stand, logo/banner, estado IN_REVIEW | RF-SHOP-001, FASE 1 |
| Gestión de productos | CRUD + archivar, variantes talla/color, inventario, stock con alertas | RF-SHOP-003/005, FASE 1 inventario |
| **Catalogación por IA** | Carga masiva (IA-003), análisis (IA-001), copy (IA-002), remoción de fondo+WebP (IA-004), SKU (IA-006), dedupe (IA-005), import Excel (IA-007) | IA-001…007 |
| Panel admin básico | Aprobar tiendas, badge verificada, cola de moderación, métricas básicas | RF-ADM-001/002, FASE 1 |
| Plataforma/Infra | Monorepo, Docker, CI/CD, observabilidad, backups, seguridad base | RNF-MANT/SEC/DISP |

**Criterios de salida Fase 1:**
- Un vendedor real de Gamarra completa onboarding y publica ≥ 20 productos vía IA en una sesión.
- Tasa de aceptación de borradores IA medida y por encima del umbral objetivo.
- Admin aprueba/modera; auditoría activa.
- CI/CD con gate de cobertura; backups y monitoreo operando.

## Fase 2 — Marketplace para compradores

**Objetivo:** vitrina pública, búsqueda inteligente, carrito multi-tienda, checkout y pagos peruanos.

| Épica | Entregables | Requerimientos |
|-------|-------------|----------------|
| Vitrina y catálogo | Home (hero, categorías, destacados, nuevas llegadas), página de categoría con filtros, página de producto, perfil de tienda | HOME, CATEGORÍAS, PRODUCTO, TIENDAS, RF-CAT-002/003/006 |
| Búsqueda inteligente | Autocompletado, filtros combinables, búsqueda semántica y por imagen, ordenamiento | RF-CAT-001/002/008, RNF-PERF-002 |
| Carrito y checkout | Carrito persistente multi-tienda, validación+reserva de stock, cálculo de envío, cupones, checkout invitado, resumen | RF-CART-001…009 |
| Pagos | Yape, Plin (QR+webhook), tarjeta (Culqi/Niubiz, 3DS), pagos fallidos claros, comprobante electrónico | RF-PAY-001/002/003/005/008 |
| Pedidos y postventa | Estados con transiciones, notificaciones por cambio, seguimiento público, cancelación, devoluciones, reseñas post-entrega, historial | RF-ORD-001…008 |
| Favoritos y notificaciones | Favoritos sin login + sync, preferencias por canal, email/WhatsApp/push | RF-CAT-005, NOTIFICACIONES |

**Criterios de salida Fase 2:**
- Compra end-to-end con Yape confirmada por webhook, comprobante emitido y notificación enviada.
- LCP < 2.5 s, búsqueda < 500 ms, autocompletado < 200 ms verificados.
- Soporta 1.000 compradores concurrentes en prueba de carga (`RNF-PERF-004`).

## Fase 3 — Aplicaciones móviles completas

**Objetivo:** paridad funcional móvil para comprador y vendedor.

| Épica | Entregables |
|-------|-------------|
| `mobile-buyer` (Expo) | Catálogo, búsqueda, carrito, checkout, pedidos, favoritos, push |
| `mobile-seller` (Expo) | Cámara para fotografiar prendas → IA, gestión de productos/pedidos, dashboard, WhatsApp al instante (RF-SHOP-008) |
| Reutilización | `packages/api-client`, design tokens, validators compartidos web↔móvil |

**Criterios de salida:** apps publicadas en stores; flujo de cámara→IA→borrador funcionando en móvil;
notificaciones push operativas.

## Fase 4 — Logística propia

**Objetivo:** preparar y luego operar logística propia (la arquitectura ya lo contempla en `Shipping`).

| Épica | Entregables |
|-------|-------------|
| Operación de envíos | Zonas, tarifas propias, asignación de repartidores, estados de ruta |
| App de repartidor | (futura) recojo en galería, prueba de entrega |
| Optimización | Agrupación de pedidos por galería/zona, ventanas de recojo |

**Criterios de salida:** un piloto de logística propia en una zona de Lima con métricas de tiempo de entrega.

## Fase 5 — IA avanzada y recomendaciones

| Épica | Entregables |
|-------|-------------|
| Recomendaciones | "También vieron", personalización de home, ranking de búsqueda con señales de comportamiento |
| IA avanzada | Pricing sugerido, detección de calidad de foto, generación de fichas enriquecidas, asistente de tienda |
| Antifraude | Modelos de riesgo en pagos y reseñas |

## Matriz de trazabilidad (resumen)

| Grupo de requerimientos | Fase |
|-------------------------|------|
| RF-AUTH-001…008 | 1 (P1 en 1; P2 social/2FA activables) |
| RF-SHOP-001…010 | 1 |
| IA-001…007 | 1 |
| RF-ADM-001…006 | 1 (básico) → 2 (finanzas/banners/cupones globales) |
| RF-CAT-001…008 | 2 |
| RF-CART-001…009 | 2 |
| RF-PAY-001…008 | 2 |
| RF-ORD-001…008 | 2 |
| NOTIFICACIONES | 2 (web) → 3 (push móvil) |
| Apps móviles | 3 |
| Shipping/Logística | modelado desde 1; operación en 4 |
| Recomendaciones/IA avanzada | 5 |
| RNF-* (perf, sec, disp, esc, mant) | transversales, base en 1, endurecidos en 2 |
