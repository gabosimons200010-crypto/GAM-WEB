# 3. Diagrama de Módulos (Bounded Contexts)

## 3.1 Mapa de contextos

El monolito modular se organiza en **bounded contexts** de Domain-Driven Design. Cada uno es candidato a
microservicio futuro. Las flechas indican dependencia (síncrona o por evento).

```
                                  ┌─────────────────────────┐
                                  │        IDENTITY          │  Users, Roles, Permissions,
                                  │  (auth, RBAC, 2FA, JWT)  │  Sessions, MFA, OAuth social
                                  └────────────┬─────────────┘
                                               │ (identidad de actor)
        ┌──────────────────────────────────────┼───────────────────────────────────┐
        ▼                                       ▼                                     ▼
┌───────────────┐   StoreApproved   ┌────────────────────┐   ProductPublished  ┌──────────────────┐
│   GAMARRA      │◀─────────────────│      SELLER          │────────────────────▶│     CATALOG       │
│ Galleries,     │                  │  Stores, membresía,  │                     │ Products, Variants│
│ ubicación,     │─────────────────▶│  onboarding, KYC/RUC │◀────────────────────│ Categories,       │
│ mapa, horario  │  (tienda↔galería)│  config, horario     │   stock/precio      │ Inventory, Media  │
└───────────────┘                   └─────────┬──────────┘                      └────────┬─────────┘
                                              │                                          │
                                              │ ProductImagesUploaded                    │ ProductChanged
                                              ▼                                          ▼
                                   ┌────────────────────┐                       ┌──────────────────┐
                                   │   AI CATALOGING     │  AIDraftReady         │     SEARCH        │
                                   │ Batches, Analysis,  │──────────────────────▶│ Index (OpenSearch)│
                                   │ dedupe, copy, SKU,  │                       │ semántica/imagen  │
                                   │ remoción fondo      │                       │ autocompletado    │
                                   └────────────────────┘                       └──────────────────┘
                                              ▲
                                              │ (borradores a revisar)
   ┌──────────────┐   OrderPlaced   ┌─────────┴──────────┐   PaymentConfirmed   ┌──────────────────┐
   │   CART /      │────────────────▶│      ORDERS         │◀────────────────────│    PAYMENTS       │
   │   CHECKOUT    │  reserva stock  │ Orders, SubOrders,  │   RefundIssued      │ Yape/Plin/Tarjeta │
   │ multi-tienda  │◀────────────────│ estados, devolución │────────────────────▶│ webhooks, boleta/ │
   └──────────────┘   stock confirm  └─────────┬──────────┘   solicitar cobro    │ factura, payout   │
                                              │                                  └──────────────────┘
                              OrderStatusChanged / OrderDelivered
                                              │
        ┌──────────────────────┬──────────────┼──────────────────┬─────────────────────┐
        ▼                      ▼              ▼                  ▼                     ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    ┌──────────────────┐
│  REVIEWS      │    │ NOTIFICATIONS│  │   SHIPPING    │  │   PROMOTIONS  │    │   ADMIN /         │
│ post-entrega  │    │ email/WA/push│  │ couriers,     │  │ Coupons,      │    │   PLATFORM        │
│ rating tienda │    │ preferencias │  │ tracking, guía│  │ banners       │    │ moderación, CMS,  │
│ /producto     │    │              │  │               │  │               │    │ finanzas, audit   │
└──────────────┘    └──────────────┘  └──────────────┘  └──────────────┘    └──────────────────┘
```

## 3.2 Catálogo de módulos

| Contexto | Responsabilidad | Tablas principales | Requerimientos |
|----------|-----------------|--------------------|----------------|
| **Identity** | Registro/login, roles (COMPRADOR, VENDEDOR, ADMIN_TIENDA, SUPER_ADMIN), permisos, 2FA, refresh tokens, OAuth social, bloqueos | `User`, `Role`, `Permission`, `RolePermission`, `Membership`, `Session`, `MfaFactor`, `LoginAttempt` | RF-AUTH-001…008, RNF-SEC-002/003/006 |
| **Gamarra** | Galerías, ubicación física, mapa, horario; relación tienda↔galería | `Gallery` | MÓDULO GAMARRA |
| **Seller** | Tienda, onboarding en 3 pasos, RUC/razón social, verificación, configuración, horario, redes | `Store`, `StoreSettings`, `StoreVerification`, `StoreSocial` | RF-SHOP-001/010, FASE 1 |
| **Catalog** | Productos, variantes (talla/color), inventario, categorías, medios, archivado | `Product`, `ProductVariant`, `Category`, `Inventory`, `ProductMedia`, `ProductAttribute` | RF-CAT-003/006, RF-SHOP-003/005, FASE 1 |
| **AI Cataloging** | Lotes de carga, análisis de visión, generación de copy, SKU, dedupe, remoción de fondo, importación Excel | `AIBatch`, `AIAnalysis`, `AIDraft`, `MediaAsset`, `ImportJob` | IA-001…007 |
| **Search** | Índice derivado OpenSearch: léxica, semántica, por imagen, autocompletado, ordenamiento | (índices, no tablas SQL propias) | RF-CAT-001/002/008, BÚSQUEDA INTELIGENTE, RNF-PERF-002 |
| **Cart/Checkout** | Carrito persistente multi-tienda, validación y reserva de stock, cálculo de envío, cupones, checkout invitado | `Cart`, `CartItem`, `StockReservation` | RF-CART-001…009 |
| **Orders** | Orden + subórdenes por tienda, máquina de estados, cancelación, devolución, historial | `Order`, `SubOrder`, `OrderItem`, `OrderStatusHistory`, `ReturnRequest` | RF-ORD-001…008 |
| **Payments** | Yape/Plin (QR+webhook), tarjeta (Culqi/Niubiz, 3DS), reembolsos, liquidación semanal, comprobante electrónico | `Payment`, `PaymentWebhookEvent`, `Refund`, `Payout`, `Invoice` | RF-PAY-001…008 |
| **Shipping** | Cotización por courier, generación de guía, tracking, página pública de seguimiento | `Shipment`, `ShippingRate`, `Courier`, `Address` | RF-CART-005, RF-ORD-003/004 |
| **Promotions** | Cupones de tienda y globales, banners, contenido destacado | `Coupon`, `CouponRedemption`, `Banner`, `FeaturedSlot` | RF-SHOP-009, RF-ADM-004/005 |
| **Reviews** | Reseñas post-entrega de producto y tienda (solo compradores verificados) | `Review`, `ReviewVote` | RF-CAT (rating), RF-ORD-007 |
| **Notifications** | Email, WhatsApp, push; preferencias por canal; plantillas | `Notification`, `NotificationPreference`, `NotificationTemplate` | RF-ORD-002, NOTIFICACIONES, RF-CAT-005 |
| **Admin/Platform** | Gestión de tiendas, moderación de productos, finanzas, CMS, logs de auditoría | `ModerationItem`, `AuditLog`, `FinanceReport`, `PlatformSetting` | RF-ADM-001…006 |

## 3.3 Reglas de dependencia

1. **Identity** no depende de nadie (raíz). Todos dependen de Identity para el actor autenticado.
2. **Catalog** y **AI Cataloging** colaboran fuertemente: AI produce borradores que Catalog materializa.
   AI depende de Catalog (taxonomía de categorías) pero no al revés en runtime crítico.
3. **Search** solo **consume** eventos; nadie depende de Search para escribir (degradación elegante).
4. **Orders** es el orquestador del flujo de compra; coordina Cart, Payments y Shipping por eventos.
5. **Payments** nunca conoce reglas de Catalog; recibe montos ya calculados por Orders.
6. **Notifications** es puramente reactivo (consume eventos), nunca es dependencia síncrona de un flujo
   crítico (`RNF-DISP-002`: si WhatsApp cae, la compra no se bloquea).

## 3.4 Eventos de dominio (contrato del bus)

| Evento | Productor | Consumidores | Disparado por |
|--------|-----------|--------------|---------------|
| `StoreSubmitted` | Seller | Admin (cola moderación), Notifications | RF-SHOP-001 |
| `StoreApproved` / `StoreRejected` | Admin | Seller, Notifications | RF-ADM-001 |
| `ProductImagesUploaded` | Catalog | AI Cataloging, Media worker | IA-003/004 |
| `AIDraftReady` | AI Cataloging | Catalog, Notifications | IA-001/002 |
| `ProductPublished` / `ProductArchived` | Catalog | Search, Promotions | RF-SHOP-003 |
| `StockChanged` / `StockLow` | Catalog | Search, Notifications, Cart | RF-SHOP-005 |
| `OrderPlaced` | Cart/Checkout | Orders, Payments, Shipping | RF-CART-007 |
| `PaymentConfirmed` / `PaymentFailed` | Payments | Orders, Notifications | RF-PAY-001/005 |
| `OrderPaid` | Orders | Catalog (confirma stock), Invoicing, Notifications | RF-PAY-008 |
| `OrderStatusChanged` | Orders | Notifications, Shipping | RF-ORD-001/002 |
| `OrderDelivered` | Shipping | Reviews (invitación 72 h), Payments (liquidación) | RF-ORD-007, RF-PAY-007 |
| `RefundIssued` | Payments | Orders, Notifications | RF-PAY-006 |
| `ReviewSubmitted` | Reviews | Catalog/Seller (recalcular rating), Search | RF-ORD-007 |

Cada evento se versiona (`v1`, `v2`) y se documenta su payload en `packages/contracts`. Esto permite
evolucionar consumidores sin romper productores — base para la futura extracción a microservicios.
