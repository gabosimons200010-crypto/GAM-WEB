# 11. Estructura de Carpetas (Monorepo)

## 11.1 Decisión: Monorepo con Turborepo + pnpm (ADR-10)

Un monorepo permite compartir el **SDK de API tipado**, los **tipos**, los **contratos de eventos**, el
**design system** y la **config** entre las cuatro apps (web×2, móvil×2) y el backend. Turborepo cachea y
paraleliza builds; pnpm workspaces gestiona dependencias con *hoisting* eficiente.

## 11.2 Árbol del repositorio

```
gamarra-go/
├── apps/
│   ├── api/                      # NestJS — monolito modular (REST + dominio + workers)
│   │   ├── src/
│   │   │   ├── modules/          # un directorio por bounded context
│   │   │   │   ├── identity/
│   │   │   │   │   ├── domain/         # entidades, value objects, reglas puras
│   │   │   │   │   ├── application/    # casos de uso, puertos
│   │   │   │   │   ├── infrastructure/ # repos Prisma, clientes, publishers
│   │   │   │   │   └── interface/      # controladores REST, DTOs, OpenAPI
│   │   │   │   ├── gamarra/
│   │   │   │   ├── seller/
│   │   │   │   ├── catalog/
│   │   │   │   ├── ai-cataloging/
│   │   │   │   ├── search/
│   │   │   │   ├── cart/
│   │   │   │   ├── orders/
│   │   │   │   ├── payments/
│   │   │   │   ├── shipping/
│   │   │   │   ├── promotions/
│   │   │   │   ├── reviews/
│   │   │   │   ├── notifications/
│   │   │   │   └── admin/
│   │   │   ├── shared/            # outbox, event-bus, guards, interceptors, errores
│   │   │   ├── workers/           # entrypoints: ai, media, notify, ops
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # (ver doc 04)
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   └── Dockerfile
│   │
│   ├── storefront/               # Next.js 15 — compradores (SSR/ISR, SEO)
│   │   ├── app/                  # App Router: home, categoría, producto, tienda, checkout
│   │   ├── components/
│   │   ├── lib/                  # react-query, api-client, zustand stores
│   │   └── Dockerfile
│   │
│   ├── dashboard/                # Next.js 15 — panel vendedor + admin (autenticado)
│   │   ├── app/(seller)/         # dashboard, productos, IA, pedidos, cupones, config
│   │   ├── app/(admin)/          # tiendas, moderación, finanzas, banners, audit
│   │   ├── components/
│   │   └── Dockerfile
│   │
│   ├── mobile-buyer/             # Expo / React Native — comprador
│   │   ├── app/                  # expo-router
│   │   ├── components/
│   │   └── app.config.ts
│   │
│   └── mobile-seller/            # Expo / React Native — vendedor (cámara → IA)
│       ├── app/
│       ├── components/
│       └── app.config.ts
│
├── packages/
│   ├── api-client/               # SDK tipado generado desde OpenAPI (compartido web+móvil)
│   ├── contracts/                # esquemas de eventos de dominio versionados (v1, v2)
│   ├── types/                    # tipos compartidos (DTOs, enums de dominio)
│   ├── ui/                       # design system web (shadcn/ui + Tailwind) compartido
│   ├── design-tokens/            # colores/espaciado/tipografía (web + móvil)
│   ├── validators/               # esquemas de validación compartidos (zod/class-validator)
│   ├── config/                   # eslint, tsconfig, tailwind, prettier base
│   └── utils/                    # helpers puros (formato moneda PEN, fechas, slug)
│
├── infra/
│   ├── docker-compose.yml        # topología local/staging completa
│   ├── docker-compose.override.yml
│   └── k8s/                      # manifiestos futuros (Fase 3+)
│
├── .github/
│   └── workflows/                # CI/CD: lint, test, build, deploy, security scan
│
├── docs/                         # este dossier de arquitectura
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 11.3 Convenciones

- **Frontera de módulos (api):** un módulo solo expone su `interface/` (REST) y sus **casos de uso públicos**
  + **eventos**. Prohibido importar `infrastructure/` de otro módulo. Se valida con reglas de ESLint de
  dependencias (`eslint-plugin-boundaries`).
- **Naming:** kebab-case en carpetas, PascalCase en clases, casos de uso como verbos
  (`CreateProductUseCase`, `ConfirmPaymentUseCase`).
- **Tipos compartidos:** nunca redefinir un DTO en el cliente; consumir `packages/api-client` y
  `packages/types`.
- **Imágenes Docker:** `api` y los `worker-*` comparten una sola imagen (distinto entrypoint).
- **Tests junto al código** (`*.spec.ts`) + `test/` para integración/e2e.
- **Migraciones Prisma** versionadas y revisadas en PR; nunca editar una migración aplicada.

## 11.4 Por qué esta estructura sostiene el crecimiento

- Extraer un módulo a microservicio = mover `apps/api/src/modules/<x>` a `apps/<x>-service/` reutilizando
  `packages/contracts` y `packages/types` sin tocar consumidores.
- Añadir un canal (p.ej. web admin separada, o una app de repartidor en Fase 4) = nueva `apps/<canal>` que
  consume el mismo `api-client`.
- El design system y los contratos centralizados evitan divergencia entre web y móvil.
