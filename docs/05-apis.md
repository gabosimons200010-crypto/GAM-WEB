# 5. Diseño de APIs

## 5.1 Principios

- **REST sobre HTTPS** (`RNF-SEC-001`), JSON, versionado por path: `/api/v1/...`.
- **OpenAPI 3.1** generado desde decoradores NestJS (`@nestjs/swagger`), publicado en `/api/docs`
  (`RNF-MANT-003`). El SDK tipado de cliente se genera desde ese OpenAPI a `packages/api-client`.
- **Autenticación:** access token JWT (15 min) en header `Authorization: Bearer`, refresh token (30 días,
  rotativo) en cookie `HttpOnly; Secure; SameSite` (`RNF-SEC-003`). Endpoints de checkout aceptan sesión
  de invitado.
- **Autorización:** RBAC por `@Roles()` + scope multi-tenant inyectado (un vendedor solo ve lo suyo,
  `RF-AUTH-006`).
- **Idempotencia:** header `Idempotency-Key` en POST de checkout/pago; webhooks deduplicados por
  `(provider, externalId)`.
- **Paginación:** cursor (`?cursor=&limit=`) para listados largos; filtros y orden por query params.
- **Errores:** formato uniforme `{ code, message, details, traceId }`; mensajes de pago en lenguaje simple
  (`RF-PAY-005`), nunca códigos técnicos al usuario.
- **Rate limiting** (`RNF-SEC-006`): login 5/min/IP, registro 3/h, checkout 10/h, vía `@nestjs/throttler` + Redis.

## 5.2 Convenciones de DTO

Validación con `class-validator` en cada DTO de entrada; sanitización de HTML en campos de texto
(`RNF-SEC-004`). Ejemplo conceptual (contrato, no implementación):

```
CreateProductDto       { name, categoryId, price, salePrice?, gender?, variants[], attributes? }
ProductVariantDto      { size?, color?, colorHex?, stock, price? }
RegisterSellerDto      { commercialName, legalName?, ruc?, email, phone, galleryId?, floor?, stand?, address? }
CheckoutDto            { cartId, addressId|guestAddress, shippingSelections[], couponCode?, paymentMethod }
AIAnalyzeBatchDto      { storeId, images: UploadRef[] }            // IA-003
ConfirmDraftDto        { aiAnalysisId, overrides? }                // publicar borrador IA
SearchQueryDto         { q?, filters{price,size,color,gender,storeId,galleryId,rating,inStock}, sort, cursor }
```

## 5.3 Catálogo de endpoints (v1)

### Identity / Auth (`RF-AUTH-001…008`)
```
POST   /api/v1/auth/register/email            RF-AUTH-001
POST   /api/v1/auth/register/phone            RF-AUTH-002 (envía OTP)
POST   /api/v1/auth/verify-otp                RF-AUTH-002
POST   /api/v1/auth/login                     RF-AUTH-007 (bloqueo 5 intentos)
POST   /api/v1/auth/oauth/:provider           RF-AUTH-003 (google|facebook)
POST   /api/v1/auth/refresh                   RF-AUTH (rota refresh token)
POST   /api/v1/auth/logout                    RF-AUTH-005 (invalida server-side)
POST   /api/v1/auth/password/forgot           RF-AUTH-004
POST   /api/v1/auth/password/reset            RF-AUTH-004
POST   /api/v1/auth/mfa/enroll  /verify       RF-AUTH-008
GET    /api/v1/me
```

### Gamarra / Galerías
```
GET    /api/v1/galleries
GET    /api/v1/galleries/:id
POST   /api/v1/admin/galleries                (admin)
```

### Seller / Tiendas (`RF-SHOP-001…010`)
```
POST   /api/v1/seller/stores                  RF-SHOP-001 (registro 3 pasos → IN_REVIEW)
GET    /api/v1/seller/stores/:id
PATCH  /api/v1/seller/stores/:id              RF-SHOP-010 (config, horario, política)
GET    /api/v1/seller/dashboard               RF-SHOP-002 (métricas)
GET    /api/v1/stores/:slug                   RF-CAT-006 (perfil público)
```

### Catálogo / Productos (`RF-CAT-003`, `RF-SHOP-003/004/005`)
```
POST   /api/v1/seller/products                RF-SHOP-003 (crear)
PATCH  /api/v1/seller/products/:id            editar
POST   /api/v1/seller/products/:id/archive    archivar
DELETE /api/v1/seller/products/:id            eliminar
GET    /api/v1/seller/products?lowStock=true  RF-SHOP-005
POST   /api/v1/seller/products/import         RF-SHOP-004 / IA-007 (Excel)
GET    /api/v1/products/:slug                 RF-CAT-003 (detalle público)
GET    /api/v1/products/:slug/related         RF-CAT-004
```

### IA de catalogación (`IA-001…007`)
```
POST   /api/v1/seller/ai/batches              IA-003 (subir 10..500 fotos → procesa async)
GET    /api/v1/seller/ai/batches/:id          estado del lote (processed/total)
GET    /api/v1/seller/ai/drafts               borradores generados (IA-001/002)
POST   /api/v1/seller/ai/drafts/:id/confirm   publicar borrador (con overrides)
GET    /api/v1/seller/ai/duplicates           IA-005 (sugerencias: fusionar/stock/ignorar)
POST   /api/v1/seller/ai/duplicates/:id/resolve
```

### Búsqueda (`RF-CAT-001/002/008`, búsqueda inteligente)
```
GET    /api/v1/search                         filtros combinables + orden (OpenSearch)
GET    /api/v1/search/autocomplete            RNF-PERF-002 (<200ms)
POST   /api/v1/search/by-image                búsqueda por imagen (embeddings)
GET    /api/v1/categories
```

### Carrito y Checkout (`RF-CART-001…009`)
```
GET    /api/v1/cart                           (usuario o anónimo)
POST   /api/v1/cart/items                     agregar (agrupa por tienda al leer)
PATCH  /api/v1/cart/items/:id                 cantidad
DELETE /api/v1/cart/items/:id
POST   /api/v1/cart/coupon                    RF-CART-006
POST   /api/v1/checkout/quote                 RF-CART-005 (envío por tienda) + RF-CART-003 (stock)
POST   /api/v1/checkout                       RF-CART-007 (crea Order + reserva 15m) [Idempotency-Key]
```

### Pagos (`RF-PAY-001…008`)
```
POST   /api/v1/payments/:orderId/yape         RF-PAY-001 (QR dinámico, expira 5m)
POST   /api/v1/payments/:orderId/plin         RF-PAY-002
POST   /api/v1/payments/:orderId/card         RF-PAY-003 (Culqi/Niubiz, 3DS)
POST   /api/v1/webhooks/payments/:provider    confirmación (dedupe por externalId)
GET    /api/v1/payments/:orderId/status
POST   /api/v1/admin/refunds                  RF-PAY-006
```

### Pedidos / Postventa (`RF-ORD-001…008`)
```
GET    /api/v1/orders                         RF-ORD-008 (historial comprador)
GET    /api/v1/orders/:id
GET    /api/v1/track?number=&dni=             RF-ORD-003 (público, sin login)
POST   /api/v1/orders/:id/cancel              RF-ORD-005
POST   /api/v1/orders/:subOrderId/return      RF-ORD-006
GET    /api/v1/seller/orders                  RF-ORD-004 (gestión por tienda)
PATCH  /api/v1/seller/orders/:subOrderId      cambiar estado + guía
POST   /api/v1/orders/:id/reviews             RF-ORD-007 (72h post-entrega)
```

### Promociones, favoritos, notificaciones
```
GET/POST/DELETE /api/v1/favorites             RF-CAT-005
POST   /api/v1/seller/coupons                 RF-SHOP-009
GET    /api/v1/me/notifications/preferences   NOTIFICACIONES
PATCH  /api/v1/me/notifications/preferences
```

### Admin (`RF-ADM-001…006`)
```
GET    /api/v1/admin/stores                   RF-ADM-001
POST   /api/v1/admin/stores/:id/approve|suspend|verify
GET    /api/v1/admin/moderation               RF-ADM-002
POST   /api/v1/admin/moderation/:id/decision
GET    /api/v1/admin/finance/report           RF-ADM-003 (export Excel)
POST   /api/v1/admin/coupons                  RF-ADM-005 (globales)
GET/POST /api/v1/admin/banners                RF-ADM-004
GET    /api/v1/admin/audit-logs               RF-ADM-006
```

## 5.4 Casos de uso clave (secuencias)

### Checkout multi-tienda + Yape (`RF-CART`, `RF-PAY-001`)
```
Cliente            api(Orders)        Catalog        Payments        Yape
  │ POST /checkout    │                  │              │             │
  │──────────────────▶│ valida+reserva   │              │             │
  │                   │─────stock FOR UPDATE────────────▶│             │
  │                   │ crea Order+SubOrders             │             │
  │                   │ Outbox(OrderPlaced)              │             │
  │ POST /payments/yape                  │              │             │
  │──────────────────────────────────────────────────▶ │ genera QR   │
  │   { qrPayload, expiresAt }           │              │────────────▶│
  │◀──────────────────────────────────────────────────│             │
  │  (usuario paga en su app Yape)       │              │             │
  │                                      │   webhook    │◀────────────│
  │                   │◀─────────────────────────────── │ POST /webhooks/payments/yape
  │                   │ dedupe externalId; PaymentConfirmed
  │                   │ OrderPaid → descuenta stock, emite comprobante,
  │                   │ notifica (email+WhatsApp), libera reserva
```

### Catalogación por IA (`IA-001…006`)
```
Vendedor      api          S3/R2     worker-media    worker-ai      Catalog
  │ POST /ai/batches (10..500 imgs)
  │────────────▶│ crea AIBatch; presigned upload
  │   subir imgs directo a S3 ───────▶│
  │             │ Outbox(ProductImagesUploaded)
  │             │                      │ remueve fondo, WebP, thumbs
  │             │                      │───▶ guarda 3 variantes (IA-004)
  │             │                                   │ visión: atributos+copy+SKU+embedding+pHash
  │             │                                   │ dedupe (IA-005), confianza
  │             │                                   │──▶ crea Product DRAFT (AIDraftReady)
  │ GET /ai/drafts  ◀── notificación ──────────────────────────────│
  │ POST /ai/drafts/:id/confirm ──────────────────────────────────▶│ Product ACTIVE → ProductPublished
```

## 5.5 Contratos de Webhooks (entrantes)

- **Pagos (`/webhooks/payments/:provider`):** verificar firma/HMAC del proveedor, deduplicar por
  `(provider, externalId)` en `PaymentWebhookEvent`, responder 200 rápido y procesar async. Reintentos del
  proveedor son seguros por idempotencia.
- **Couriers (tracking):** actualizan `Shipment.status` y emiten `OrderStatusChanged`.

Todos los webhooks son **idempotentes** y se registran para auditoría.
