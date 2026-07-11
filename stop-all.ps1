# stop-all.ps1 — Cierra TODO GAMARRA GO y libera memoria.
# Corre esto cuando termines de trabajar (evita que se acumulen procesos y se ponga lenta la PC).
# Uso: powershell -ExecutionPolicy Bypass -File "...\stop-all.ps1"

Write-Host ""
Write-Host "==== GAMARRA GO — cerrando todo ====" -ForegroundColor Cyan

# 1) Cierra los servidores de desarrollo (API, Web, Metro = procesos node)
$node = Get-Process node -ErrorAction SilentlyContinue
if ($node) {
  Write-Host ("[1/2] Cerrando {0} procesos node (dev servers)..." -f $node.Count) -ForegroundColor Yellow
  $node | Stop-Process -Force -ErrorAction SilentlyContinue
  Write-Host "      Servidores cerrados, RAM liberada." -ForegroundColor Green
} else {
  Write-Host "[1/2] No hay servidores node corriendo." -ForegroundColor Green
}

# 2) Detiene los contenedores Docker (los datos se conservan; arrancan rápido la próxima vez)
Write-Host "[2/2] Deteniendo contenedores Docker..." -ForegroundColor Yellow
docker compose -f "$PSScriptRoot\infra\docker-compose.yml" stop | Out-Host

Write-Host ""
Write-Host "Listo. Todo cerrado y memoria liberada. Para volver a trabajar: start-all.ps1" -ForegroundColor Cyan
Write-Host ""
