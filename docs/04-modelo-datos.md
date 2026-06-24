# 4. Modelo de Datos (Prisma)

Esquema Prisma completo cubriendo las entidades pedidas (`Users, Roles, Permissions, Stores, Galleries,
Products, Categories, Variants, Inventory, Orders, OrderItems, Payments, Coupons, Reviews, Notifications,
AIAnalysis, AuditLogs`) y las que el diseño exige adicionalmente (subórdenes, reservas de stock, payouts,
comprobantes, devoluciones, importaciones, banners, etc.).

> Este es el **artefacto de diseño** del modelo de datos. Es el contrato del que partirá la implementación;
> aún no se ejecutan migraciones.

## 4.1 Decisiones de modelado

- **IDs:** `cuid()` (ordenable, no adivinable) para entidades de negocio. `String` PK.
- **Multi-tenant:** `storeId` presente y indexado en toda entidad de tienda; aislamiento forzado en la capa
  de aplicación (ver doc 01 §1.5).
- **Dinero:** `Decimal @db.Decimal(12, 2)` en soles (PEN). Nunca `Float`. Moneda explícita por si crece.
- **Variantes:** una fila `ProductVariant` por combinación talla×color, con su propio `Inventory` y SKU
  (`RF-SHOP-003`, `IA-006`).
- **Atributos flexibles de IA:** `JSONB` (`attributes`) para material/estilo/temporada/corte además de
  columnas tipadas para lo que se filtra (`RF-CAT-002`).
- **Outbox:** tabla `OutboxEvent` para el patrón evento↔dato consistente.
- **Soft delete / archivado:** `archivedAt`/`deletedAt` donde el requerimiento pide "archivar" (productos).
- **Auditoría:** `AuditLog` para `RF-ADM-006` y `RNF-SEC`.
- **Búsqueda semántica de respaldo:** `pgvector` (`Unsupported("vector")`) opcional en `Product` como
  fallback si OpenSearch no está disponible.

## 4.2 Esquema `schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm, vector]
}

// ─────────────────────────── IDENTITY ───────────────────────────

enum UserStatus { PENDING ACTIVE BLOCKED SUSPENDED }

model User {
  id            String     @id @default(cuid())
  email         String?    @unique
  phone         String?    @unique            // RF-AUTH-002: registro por celular
  passwordHash  String?                       // bcrypt cost 12 (RNF-SEC-002)
  fullName      String?
  status        UserStatus @default(PENDING)
  emailVerified DateTime?
  phoneVerified DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  roles          UserRole[]
  memberships    Membership[]               // pertenencia a tiendas (vendedor)
  sessions       Session[]
  mfaFactors     MfaFactor[]
  socialAccounts SocialAccount[]
  addresses      Address[]
  carts          Cart[]
  orders         Order[]
  reviews        Review[]
  favorites      Favorite[]
  notifications  Notification[]
  notifPrefs     NotificationPreference[]
  auditLogs      AuditLog[]                 @relation("ActorAudit")

  @@index([status])
}

enum RoleName { COMPRADOR VENDEDOR ADMIN_TIENDA ADMIN SUPER_ADMIN }

model Role {
  id          String           @id @default(cuid())
  name        RoleName         @unique
  description String?
  permissions RolePermission[]
  users       UserRole[]
}

model Permission {
  id    String           @id @default(cuid())
  key   String           @unique          // p.ej. "product:write", "order:read:own"
  roles RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model Membership {                          // vincula usuario↔tienda con rol de tienda
  id        String   @id @default(cuid())
  userId    String
  storeId   String
  storeRole RoleName  @default(ADMIN_TIENDA)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  @@unique([userId, storeId])
  @@index([storeId])
}

model Session {                             // refresh tokens rotativos (RNF-SEC-003)
  id           String   @id @default(cuid())
  userId       String
  refreshHash  String                       // hash del refresh token (HttpOnly cookie)
  userAgent    String?
  ip           String?
  expiresAt    DateTime                      // 30 días, reemplazado en cada uso
  revokedAt    DateTime?
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

enum MfaType { TOTP SMS }

model MfaFactor {                            // RF-AUTH-008: 2FA obligatorio admin
  id        String  @id @default(cuid())
  userId    String
  type      MfaType
  secret    String                           // cifrado en reposo
  confirmed Boolean @default(false)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model SocialAccount {                        // RF-AUTH-003: Google/Facebook
  id         String @id @default(cuid())
  userId     String
  provider   String                          // "google" | "facebook"
  providerId String
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerId])
}

model LoginAttempt {                         // RF-AUTH-007 / RNF-SEC-006
  id         String   @id @default(cuid())
  identifier String                          // email/phone/ip
  success    Boolean
  ip         String?
  createdAt  DateTime @default(now())
  @@index([identifier, createdAt])
}

// ─────────────────────────── GAMARRA ───────────────────────────

model Gallery {                              // MÓDULO GAMARRA
  id        String  @id @default(cuid())
  name      String
  address   String
  schedule  Json?                            // horario por día
  latitude  Decimal? @db.Decimal(9, 6)
  longitude Decimal? @db.Decimal(9, 6)
  mapUrl    String?
  createdAt DateTime @default(now())
  stores    Store[]
  @@index([name])
}

// ─────────────────────────── SELLER ───────────────────────────

enum StoreStatus { DRAFT IN_REVIEW APPROVED SUSPENDED REJECTED }

model Store {
  id            String      @id @default(cuid())
  slug          String      @unique
  commercialName String                       // Nombre comercial (FASE 1)
  legalName     String?                       // Razón social
  ruc           String?     @unique           // RUC
  email         String
  phone         String
  galleryId     String?
  floor         String?                        // Piso
  stand         String?                        // Stand
  address       String?
  logoUrl       String?
  bannerUrl     String?
  description   String?
  status        StoreStatus @default(DRAFT)
  verified      Boolean     @default(false)    // badge tienda verificada
  rating        Decimal     @default(0) @db.Decimal(3, 2)
  salesCount    Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  approvedAt    DateTime?

  gallery       Gallery?      @relation(fields: [galleryId], references: [id])
  memberships   Membership[]
  settings      StoreSettings?
  socials       StoreSocial[]
  categories    StoreCategory[]
  products      Product[]
  subOrders     SubOrder[]
  coupons       Coupon[]
  payouts       Payout[]
  reviews       Review[]

  @@index([status])
  @@index([galleryId])
}

model StoreSettings {                         // RF-SHOP-010
  storeId            String  @id
  schedule           Json?                     // horario de atención
  preparationDays    Int     @default(2)       // tiempo de preparación
  returnPolicy       String?                   // política devoluciones (texto libre)
  lowStockThreshold  Int     @default(5)       // RF-SHOP-005
  store              Store   @relation(fields: [storeId], references: [id], onDelete: Cascade)
}

model StoreSocial {
  id       String @id @default(cuid())
  storeId  String
  platform String                              // instagram/facebook/tiktok/whatsapp
  url      String
  store    Store  @relation(fields: [storeId], references: [id], onDelete: Cascade)
  @@index([storeId])
}

model StoreCategory {
  storeId    String
  categoryId String
  store      Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@id([storeId, categoryId])
}

// ─────────────────────────── CATALOG ───────────────────────────

enum ProductStatus { DRAFT IN_REVIEW ACTIVE PAUSED ARCHIVED REJECTED }
enum Gender { HOMBRE MUJER NINO NINA UNISEX }

model Category {
  id        String     @id @default(cuid())
  parentId  String?
  name      String
  slug      String     @unique
  imageUrl  String?
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]
  stores    StoreCategory[]
  @@index([parentId])
}

model Product {
  id           String        @id @default(cuid())
  storeId      String
  categoryId   String?
  sku          String                              // IA-006: SKU automático
  name         String                              // IA-002: generado por IA, editable
  slug         String        @unique
  description  String?                             // IA-002
  gender       Gender?
  price        Decimal       @db.Decimal(12, 2)
  salePrice    Decimal?      @db.Decimal(12, 2)
  status       ProductStatus @default(DRAFT)
  attributes   Json?                               // material/estilo/temporada/corte (IA-001)
  tags         String[]                            // IA-002 tags/keywords SEO
  embedding    Unsupported("vector(1024)")?        // fallback semántico (pgvector)
  ratingAvg    Decimal       @default(0) @db.Decimal(3, 2)
  ratingCount  Int           @default(0)
  soldCount    Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  archivedAt   DateTime?                            // RF-SHOP "archivar"

  store        Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  category     Category?      @relation(fields: [categoryId], references: [id])
  variants     ProductVariant[]
  media        ProductMedia[]
  aiAnalysis   AIAnalysis[]
  reviews      Review[]
  favorites    Favorite[]

  @@unique([storeId, sku])
  @@index([storeId, status])
  @@index([categoryId])
  @@index([price])
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  sku       String                                 // SKU por variante
  size      String?                                 // talla
  color     String?                                 // color
  colorHex  String?
  price     Decimal? @db.Decimal(12, 2)             // override opcional
  inventory Inventory?
  orderItems OrderItem[]
  reservations StockReservation[]
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([productId, size, color])
  @@index([productId])
}

model Inventory {
  variantId   String   @id
  available   Int      @default(0)
  reserved    Int      @default(0)                  // reservado en checkouts activos
  updatedAt   DateTime @updatedAt
  variant     ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
}

enum MediaKind { ORIGINAL NO_BACKGROUND OPTIMIZED }

model ProductMedia {                                // IA-004: 3 variantes por foto
  id        String    @id @default(cuid())
  productId String
  kind      MediaKind
  url       String                                  // S3/R2 key servido por CDN
  width     Int?
  height    Int?
  bytes     Int?
  position  Int       @default(0)
  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId, position])
}

// ─────────────────────────── AI CATALOGING ───────────────────────────

enum AIBatchStatus { UPLOADING QUEUED PROCESSING PARTIAL DONE FAILED }
enum AIAnalysisStatus { PENDING DONE FAILED LOW_CONFIDENCE }

model AIBatch {                                     // IA-003: carga masiva 10..500 fotos
  id         String        @id @default(cuid())
  storeId    String
  status     AIBatchStatus @default(UPLOADING)
  total      Int           @default(0)
  processed  Int           @default(0)
  failed     Int           @default(0)
  source     String        @default("upload")       // upload | excel
  createdAt  DateTime      @default(now())
  analyses   AIAnalysis[]
  @@index([storeId, status])
}

model AIAnalysis {                                  // IA-001/002: resultado por imagen
  id          String           @id @default(cuid())
  batchId     String?
  productId   String?                                // se enlaza al crear el borrador
  storeId     String
  imageUrl    String
  status      AIAnalysisStatus @default(PENDING)
  provider    String?                                // claude | openai
  model       String?                                // id de modelo usado
  confidence  Decimal?         @db.Decimal(4, 3)
  result      Json?                                  // atributos + copy + tags extraídos
  imageHash   String?                                // pHash para dedupe (IA-005)
  embedding   Unsupported("vector(1024)")?           // para similitud/búsqueda por imagen
  costUsd     Decimal?         @db.Decimal(10, 5)    // control de costo IA
  createdAt   DateTime         @default(now())
  batch       AIBatch?         @relation(fields: [batchId], references: [id], onDelete: SetNull)
  product     Product?         @relation(fields: [productId], references: [id], onDelete: SetNull)
  @@index([storeId, status])
  @@index([imageHash])
}

enum ImportStatus { PENDING VALIDATING VALIDATED IMPORTING DONE FAILED }

model ImportJob {                                   // IA-007: importación Excel
  id        String       @id @default(cuid())
  storeId   String
  fileUrl   String
  status    ImportStatus @default(PENDING)
  rowsTotal Int          @default(0)
  rowsOk    Int          @default(0)
  rowsError Int          @default(0)
  errors    Json?                                    // detalle por fila
  createdAt DateTime     @default(now())
  @@index([storeId, status])
}

// ─────────────────────────── CART / CHECKOUT ───────────────────────────

model Cart {                                        // RF-CART-001: persistente 30 días
  id            String     @id @default(cuid())
  userId        String?
  anonymousId   String?                              // carrito invitado (cookie/device)
  couponCode    String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  expiresAt     DateTime?
  user          User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  items         CartItem[]
  @@index([userId])
  @@index([anonymousId])
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  variantId String
  quantity  Int     @default(1)
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  @@unique([cartId, variantId])
}

model StockReservation {                            // RF-CART-004: reserva 15 min
  id        String   @id @default(cuid())
  variantId String
  orderId   String?
  quantity  Int
  expiresAt DateTime
  createdAt DateTime @default(now())
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  @@index([expiresAt])
  @@index([variantId])
}

// ─────────────────────────── ORDERS ───────────────────────────

enum OrderStatus { PENDING_PAYMENT PAID CANCELLED }
enum SubOrderStatus {
  PENDING_PAYMENT PAID PREPARING READY_FOR_PICKUP SHIPPED DELIVERED
  CANCELLED RETURNED DELIVERY_FAILED
}

model Order {                                       // pago único, multi-tienda (RF-CART-002)
  id            String      @id @default(cuid())
  number        String      @unique                  // legible para seguimiento
  userId        String?
  guestEmail    String?                              // RF-CART-008 checkout invitado
  guestPhone    String?
  guestName     String?
  buyerDni      String?                              // seguimiento público (RF-ORD-003)
  status        OrderStatus @default(PENDING_PAYMENT)
  subtotal      Decimal     @db.Decimal(12, 2)
  shippingTotal Decimal     @db.Decimal(12, 2)
  discountTotal Decimal     @default(0) @db.Decimal(12, 2)
  grandTotal    Decimal     @db.Decimal(12, 2)
  addressId     String?
  couponCode    String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  address       Address?    @relation(fields: [addressId], references: [id])
  subOrders     SubOrder[]
  payments      Payment[]
  invoice       Invoice?
  @@index([userId])
  @@index([status])
}

model SubOrder {                                     // una por tienda dentro de la orden
  id            String         @id @default(cuid())
  orderId       String
  storeId       String
  status        SubOrderStatus @default(PENDING_PAYMENT)
  subtotal      Decimal        @db.Decimal(12, 2)
  shippingCost  Decimal        @db.Decimal(12, 2)
  commission    Decimal        @default(0) @db.Decimal(12, 2)  // comisión de plataforma
  trackingCode  String?
  createdAt     DateTime       @default(now())
  order         Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  store         Store          @relation(fields: [storeId], references: [id])
  items         OrderItem[]
  statusHistory OrderStatusHistory[]
  shipment      Shipment?
  returnRequest ReturnRequest?
  @@index([storeId, status])
  @@index([orderId])
}

model OrderItem {
  id          String  @id @default(cuid())
  subOrderId  String
  variantId   String
  productName String                                 // snapshot histórico
  size        String?
  color       String?
  unitPrice   Decimal @db.Decimal(12, 2)             // snapshot de precio
  quantity    Int
  subOrder    SubOrder       @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  @@index([subOrderId])
}

model OrderStatusHistory {                           // RF-ORD-001: trazabilidad de estado
  id         String         @id @default(cuid())
  subOrderId String
  status     SubOrderStatus
  changedBy  String?                                 // userId que cambió
  note       String?
  createdAt  DateTime       @default(now())
  subOrder   SubOrder       @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
  @@index([subOrderId])
}

enum ReturnReason { WRONG_SIZE DAMAGED NOT_AS_PICTURED CHANGED_MIND }
enum ReturnStatus { REQUESTED APPROVED REJECTED REFUNDED }

model ReturnRequest {                                // RF-ORD-006
  id         String       @id @default(cuid())
  subOrderId String       @unique
  reason     ReturnReason
  status     ReturnStatus @default(REQUESTED)
  comment    String?
  createdAt  DateTime     @default(now())
  subOrder   SubOrder     @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
}

// ─────────────────────────── PAYMENTS ───────────────────────────

enum PaymentMethod { YAPE PLIN CARD TRANSFER }
enum PaymentStatus { CREATED PENDING CONFIRMED FAILED EXPIRED REFUNDED }

model Payment {
  id          String        @id @default(cuid())
  orderId     String
  method      PaymentMethod
  status      PaymentStatus @default(CREATED)
  amount      Decimal       @db.Decimal(12, 2)
  currency    String        @default("PEN")
  provider    String?                                // culqi | niubiz | yape | plin
  providerRef String?                                // id de transacción externa
  qrPayload   String?                                // QR dinámico Yape/Plin
  expiresAt   DateTime?                              // RF-PAY-001: QR expira 5 min
  cardToken   String?                                // RF-PAY-004 tokenización (no PAN)
  createdAt   DateTime      @default(now())
  confirmedAt DateTime?
  order       Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  webhooks    PaymentWebhookEvent[]
  refunds     Refund[]
  @@index([orderId])
  @@index([status])
  @@index([providerRef])
}

model PaymentWebhookEvent {                          // idempotencia de webhooks
  id          String   @id @default(cuid())
  paymentId   String?
  provider    String
  externalId  String                                 // id del evento del proveedor
  payload     Json
  processedAt DateTime?
  createdAt   DateTime @default(now())
  payment     Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)
  @@unique([provider, externalId])                   // dedupe de reintentos
}

model Refund {                                       // RF-PAY-006
  id         String   @id @default(cuid())
  paymentId  String
  amount     Decimal  @db.Decimal(12, 2)
  reason     String?
  status     String   @default("pending")            // pending | done | failed
  createdBy  String?                                  // admin
  createdAt  DateTime @default(now())
  payment    Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  @@index([paymentId])
}

model Payout {                                       // RF-PAY-007: liquidación semanal
  id         String   @id @default(cuid())
  storeId    String
  periodFrom DateTime
  periodTo   DateTime
  gross      Decimal  @db.Decimal(12, 2)
  commission Decimal  @db.Decimal(12, 2)
  net        Decimal  @db.Decimal(12, 2)
  status     String   @default("pending")
  createdAt  DateTime @default(now())
  store      Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  @@index([storeId, periodTo])
}

enum InvoiceType { BOLETA FACTURA }

model Invoice {                                      // RF-PAY-008: comprobante electrónico
  id          String      @id @default(cuid())
  orderId     String      @unique
  type        InvoiceType
  series      String?
  number      String?
  xmlUrl      String?                                // XML guardado
  pdfUrl      String?                                // PDF enviado por email
  status      String      @default("pending")        // pending | issued | rejected
  issuedAt    DateTime?
  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// ─────────────────────────── SHIPPING ───────────────────────────

model Courier {
  id       String  @id @default(cuid())
  name     String
  active   Boolean @default(true)
  shipments Shipment[]
  rates    ShippingRate[]
}

model ShippingRate {
  id         String  @id @default(cuid())
  courierId  String
  region     String                                  // departamento/zona
  basePrice  Decimal @db.Decimal(12, 2)
  perKg      Decimal @default(0) @db.Decimal(12, 2)
  etaDays    Int     @default(3)
  courier    Courier @relation(fields: [courierId], references: [id], onDelete: Cascade)
  @@index([region])
}

model Shipment {                                     // RF-ORD-004: guía + tracking
  id           String   @id @default(cuid())
  subOrderId   String   @unique
  courierId    String?
  trackingCode String?
  labelUrl     String?                               // guía de remisión imprimible
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  subOrder     SubOrder @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
  courier      Courier? @relation(fields: [courierId], references: [id])
}

model Address {                                      // direcciones del comprador
  id          String  @id @default(cuid())
  userId      String?
  department  String
  province    String
  district    String
  line        String
  reference   String?
  phone       String?
  isDefault   Boolean @default(false)
  user        User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders      Order[]
  @@index([userId])
}

// ─────────────────────────── PROMOTIONS ───────────────────────────

enum CouponScope { STORE GLOBAL }
enum CouponType { PERCENT FIXED }

model Coupon {                                       // RF-SHOP-009 / RF-ADM-005
  id            String      @id @default(cuid())
  code          String      @unique
  scope         CouponScope @default(STORE)
  storeId       String?                              // null si global
  type          CouponType
  value         Decimal     @db.Decimal(12, 2)
  minPurchase   Decimal?    @db.Decimal(12, 2)
  maxRedemptions Int?
  perUserLimit  Int?        @default(1)
  startsAt      DateTime?
  expiresAt     DateTime?
  active        Boolean     @default(true)
  createdAt     DateTime    @default(now())
  store         Store?      @relation(fields: [storeId], references: [id], onDelete: Cascade)
  redemptions   CouponRedemption[]
  @@index([storeId])
}

model CouponRedemption {
  id        String   @id @default(cuid())
  couponId  String
  userId    String?
  orderId   String?
  createdAt DateTime @default(now())
  coupon    Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  @@index([couponId])
}

model Banner {                                       // RF-ADM-004
  id        String   @id @default(cuid())
  title     String?
  imageUrl  String
  linkUrl   String?
  position  Int      @default(0)
  active    Boolean  @default(true)
  startsAt  DateTime?
  endsAt    DateTime?
  createdAt DateTime @default(now())
}

model FeaturedSlot {                                 // tiendas/productos destacados
  id        String   @id @default(cuid())
  kind      String                                   // "store" | "product" | "category"
  refId     String
  position  Int      @default(0)
  active    Boolean  @default(true)
}

// ─────────────────────────── REVIEWS ───────────────────────────

model Review {                                       // RF-ORD-007 (solo compradores)
  id         String   @id @default(cuid())
  userId     String
  productId  String?
  storeId    String?
  subOrderId String?                                  // verifica compra
  rating     Int                                      // 1..5
  comment    String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product    Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  store      Store?   @relation(fields: [storeId], references: [id], onDelete: SetNull)
  @@index([productId])
  @@index([storeId])
}

model Favorite {                                     // RF-CAT-005
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([userId, productId])
}

// ─────────────────────────── NOTIFICATIONS ───────────────────────────

enum NotifChannel { EMAIL WHATSAPP PUSH }

model Notification {
  id        String       @id @default(cuid())
  userId    String?
  channel   NotifChannel
  template  String
  payload   Json?
  status    String       @default("queued")          // queued | sent | failed
  sentAt    DateTime?
  createdAt DateTime     @default(now())
  user      User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  @@index([userId, status])
}

model NotificationPreference {
  id        String       @id @default(cuid())
  userId    String
  channel   NotifChannel
  topic     String                                   // order_update | price_drop | promo
  enabled   Boolean      @default(true)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, channel, topic])
}

model NotificationTemplate {
  id       String       @id @default(cuid())
  key      String       @unique
  channel  NotifChannel
  subject  String?
  body     String                                    // plantilla con variables
}

// ─────────────────────────── ADMIN / PLATFORM ───────────────────────────

enum ModerationStatus { PENDING APPROVED REJECTED }

model ModerationItem {                               // RF-ADM-002: cola de moderación
  id         String           @id @default(cuid())
  kind       String                                  // "product" | "store"
  refId      String
  status     ModerationStatus @default(PENDING)
  reason     String?
  reviewedBy String?
  createdAt  DateTime         @default(now())
  reviewedAt DateTime?
  @@index([kind, status])
}

model AuditLog {                                      // RF-ADM-006 / RNF-SEC
  id         String   @id @default(cuid())
  actorId    String?
  action     String                                  // "refund.issue", "store.suspend"…
  entity     String                                  // "Order" | "Store" | …
  entityId   String?
  metadata   Json?
  ip         String?
  createdAt  DateTime @default(now())
  actor      User?    @relation("ActorAudit", fields: [actorId], references: [id])
  @@index([entity, entityId])
  @@index([actorId, createdAt])
}

model PlatformSetting {
  key   String @id
  value Json
}

// ─────────────────────────── EVENT OUTBOX ───────────────────────────

model OutboxEvent {                                  // patrón outbox (consistencia)
  id          String    @id @default(cuid())
  aggregate   String                                  // "Order" | "Product" | …
  aggregateId String
  type        String                                  // "OrderPaid" | "AIDraftReady" | …
  version     Int       @default(1)
  payload     Json
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  @@index([publishedAt])
  @@index([aggregate, aggregateId])
}
```

## 4.3 Índices y rendimiento

- Índices compuestos por patrón de consulta real: `Product(storeId, status)`, `SubOrder(storeId, status)`,
  `Inventory(variantId)`, `Payment(providerRef)`, `OutboxEvent(publishedAt)`.
- Para catálogo y filtros (`RF-CAT-002`): la búsqueda con filtros combinables **se sirve desde OpenSearch**,
  no desde Postgres; los índices SQL cubren el camino transaccional y los *fallbacks*.
- `pg_trgm` habilita búsqueda difusa de respaldo (autocompletado degradado si OpenSearch cae).
- `StockReservation(expiresAt)` permite barrido eficiente del worker que libera reservas vencidas.

## 4.4 Integridad transaccional (stock y pago)

```
$transaction:
  1. SELECT inventory FOR UPDATE (variantes del carrito)
  2. validar available - reserved >= cantidad     (RF-CART-003)
  3. crear StockReservation (expiresAt = now + 15m)  (RF-CART-004)
  4. crear Order + SubOrders + OrderItems
  5. insertar OutboxEvent("OrderPlaced")
COMMIT
```

Al confirmar el pago (`PaymentConfirmed`), otra transacción descuenta `available`, libera la reserva y
emite `OrderPaid`. Un worker cron libera reservas vencidas. Esto previene sobreventa bajo los 1.000
usuarios concurrentes de `RNF-PERF-004`.
