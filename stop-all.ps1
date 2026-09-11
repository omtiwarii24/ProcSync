# ============================================================================
# ProcSync (GovInnovate / SIH26136) - Stop the full stack
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\stop-all.ps1
#
# Stops: backend API (:8000), Login (:3002), Gov (:3000), Startup (:3001),
#        and the Postgres container. All data persists.
# ============================================================================

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($port in 8000, 3000, 3001, 3002) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $conns) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
      taskkill /PID $proc.Id /T /F *> $null
      Write-Host "Stopped $($proc.ProcessName) (port $port)"
    }
  }
}

Push-Location (Join-Path $Root "backend")
docker compose stop db *> $null
Pop-Location
Write-Host "Postgres container stopped (data preserved)."
Write-Host "Stack down."
