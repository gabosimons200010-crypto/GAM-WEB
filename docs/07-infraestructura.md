# 7. Diseño de Infraestructura

## 7.1 Topología de contenedores (Docker — `RNF-ESC-001`)

Cada componente en su contenedor, definidos en `docker-compose.yml` (local/staging) y como imágenes para
el orquestador de producción.

```
services:
  storefront      # Next.js 15 (compradores, SSR/ISR)
  dashboard       # Next.js 15 (vendedor + admin)
  api             # NestJS (REST + dominio)
  worker-ai       # NestJS worker — cola "ai"
  worker-media    # NestJS worker — remoción fondo / WebP (CPU; GPU opcional)
  worker-notify   # NestJS worker — email / WhatsApp / push
  worker-ops      # NestJS worker — reportes, liquidaciones, reindex, cron
  postgres        # PostgreSQL 16 (+ extensiones pg_trgm, vector)
  redis           # Redis 7 (caché + BullMQ + locks)
  opensearch      # OpenSearch (búsqueda)
  minio           # S3 local en dev (en prod: Cloudflare R2 / AWS S3)
  otel-collector  # OpenTelemetry collector
  prometheus      # métricas
  grafana         # dashboards + alertas
```

Los `worker-*` comparten la imagen del `api` con distinto *entrypoint* (mismo código, distinto proceso),
simplificando el build y garantizando paridad de dominio.

## 7.2 Entornos

| Entorno | Propósito | Datos | Despliegue |
|---------|-----------|-------|------------|
| **local** | Desarrollo | Semilla/fixtures, MinIO | `docker compose up` |
| **staging** | QA, demos, pruebas de integración con sandbox de pagos | Anonimizados | Auto-deploy desde `main` (CI) |
| **production** | Real | Reales, backups | Deploy con **aprobación manual** (`RNF-MANT-002`) |

Configuración por **variables de entorno** y *secrets manager* (nunca en repo). Cada entorno tiene su set
de claves (pasarelas en modo sandbox vs producción).

## 7.3 CI/CD (GitHub Actions — `RNF-MANT-002`)

```
push / PR ─▶  [lint] ─▶ [typecheck] ─▶ [test unit+integration]
                                          │  cobertura: pagos/auth/stock ≥ 90%,
                                          │  resto ≥ 70%  (RNF-MANT-001) — gate
                                          ▼
                                   [build imágenes Docker]
                                          ▼
                          merge a main ─▶ [deploy staging automático]
                                          ▼
                              [scan vulnerabilidades]  (RNF-SEC-008, gate críticas/altas)
                                          ▼
                          [deploy production — APROBACIÓN MANUAL]
```

- Pipelines separados por app del monorepo con cache de Turborepo (solo se construye lo que cambió).
- Migraciones Prisma se ejecutan como paso versionado y reversible antes del deploy.
- Smoke tests post-deploy + *health checks* antes de enrutar tráfico.

## 7.4 Red, TLS y CDN

- **HTTPS en todo** (`RNF-SEC-001`): TLS terminado en el CDN/Load Balancer; redirección 80→443; certificados
  renovados automáticamente.
- **CDN** (Cloudflare / CloudFront) delante de storefront, dashboard y **assets de imagen** (`RNF-ESC-002`):
  imágenes WebP servidas desde el *edge*, cerca del usuario.
- Imágenes subidas se almacenan **fuera del directorio web** y no son accesibles directamente
  (`RNF-SEC-007`); se validan tipo real y tamaño antes de aceptar.

## 7.5 Datos: respaldo y recuperación (`RNF-DISP-004/005`)

- **Backups automáticos cada hora** de PostgreSQL a almacenamiento separado de los servidores principales
  (`RPO < 1 h`).
- **PITR** (point-in-time recovery) habilitado.
- **RTO < 1 h:** *runbook* de recuperación documentado; réplica de lectura promovible a primaria; imágenes
  ya están replicadas en object storage.
- OpenSearch y Redis son **reconstruibles** desde Postgres (índice derivado / caché), por lo que no son
  punto único de pérdida de datos.

## 7.6 Observabilidad (`RNF-MANT-004`, `RNF-DISP-006`)

- **Sentry:** captura de errores con contexto (traza, usuario, frecuencia) en todas las apps y workers.
- **Prometheus + Grafana:** métricas de negocio y técnicas — latencia p95/p99 por endpoint, RPS, tasa de
  error, profundidad y *lag* de colas BullMQ, costo IA/imagen, tasa de éxito de pagos, hits de caché.
- **OpenTelemetry:** trazas distribuidas request→caso de uso→cola→worker→proveedor externo (clave para
  depurar IA y pagos asíncronos).
- **Alertas:** servidor caído o tasa de error > 1 % ⇒ alerta al equipo en **< 5 min** vía WhatsApp/PagerDuty
  (`RNF-DISP-006`). Monitor externo (cada 60 s) para SLA de disponibilidad (`RNF-DISP-001`).

## 7.7 Seguridad operativa (`RNF-SEC`)

| Control | Mecanismo |
|---------|-----------|
| Contraseñas | bcrypt cost 12 (`RNF-SEC-002`) |
| Tokens | access 15 min + refresh 30 d rotativo en cookie HttpOnly (`RNF-SEC-003`) |
| Validación/sanitización | DTOs `class-validator` + saneo HTML (`RNF-SEC-004`) |
| PAN tarjetas | nunca tocan el servidor; iframe del proveedor (`RNF-SEC-005`) |
| Rate limiting | login 5/min, registro 3/h, checkout 10/h (`RNF-SEC-006`) |
| Archivos | validación de tipo real, almacenamiento fuera del web root (`RNF-SEC-007`) |
| SQLi/XSS/CSRF | ORM parametrizado (Prisma), saneo, tokens CSRF en formularios web, SameSite cookies |
| 2FA | obligatorio admin/super-admin (`RF-AUTH-008`) |
| Auditoría | `AuditLog` de acciones sensibles (`RF-ADM-006`) |
| Escaneo | SAST/DAST en CI antes de prod (`RNF-SEC-008`) |
| Secretos | gestor de secretos por entorno, rotación |

## 7.8 Mantenimiento (`RNF-DISP-003`)

Ventanas programadas solo de 2 a 5 am (lun–jue), con aviso de 48 h en el sitio y por email a tiendas.
Migraciones *online* y *zero-downtime* cuando es posible; *feature flags* para activar P2 gradualmente.
