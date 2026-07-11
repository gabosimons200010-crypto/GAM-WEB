# start-all.ps1 — Levanta TODO GAMARRA GO con un solo comando.
# Uso: clic derecho > "Ejecutar con PowerShell", o en una terminal: .\start-all.ps1
# Abre API, Web y Metro cada uno en su propia ventana (la de Metro muestra el QR).

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
Write-Host ""
Write-Host "==== GAMARRA GO — arrancando todo ====" -ForegroundColor Cyan

# 1) Infraestructura Docker (postgres, redis, opensearch, minio)
Write-Host "[1/4] Docker: levantando contenedores..." -ForegroundColor Yellow
docker compose -f "$root\infra\docker-compose.yml" up -d | Out-Host

# 2) Esperar a que Postgres acepte conexiones (evita el crash P1001 de la API)
Write-Host "[2/4] Esperando a Postgres..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  docker exec gamarra-go-postgres-1 pg_isready 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if ($ready) { Write-Host "      Postgres listo." -ForegroundColor Green }
else { Write-Host "      Postgres no respondió — abre Docker Desktop y reintenta." -ForegroundColor Red }

# 3) API, Web y Metro, cada uno en su ventana (persisten aunque cierres esta)
Write-Host "[3/4] Abriendo API, Web y Metro en ventanas separadas..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; Write-Host 'API — http://localhost:4000' -ForegroundColor Cyan; pnpm --filter @gamarra/api dev"
Start-Sleep -Seconds 8   # deja que la API tome la DB antes de arrancar la web
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; Write-Host 'WEB — http://localhost:3000' -ForegroundColor Cyan; pnpm --filter @gamarra/web dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root\apps\mobile-buyer'; Write-Host 'METRO — escanea el QR con Expo Go' -ForegroundColor Cyan; npx expo start"

# 4) Listo
Write-Host "[4/4] Listo." -ForegroundColor Green
Write-Host ""
Write-Host "  Web:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API:   http://localhost:4000/api/v1/health" -ForegroundColor Cyan
Write-Host "  App:   escanea el QR de la ventana de Metro con Expo Go (mismo Wi-Fi)." -ForegroundColor Cyan
Write-Host ""
Write-Host "  La primera carga de la app tarda ~40s (construye el bundle); luego es rápida." -ForegroundColor DarkGray
