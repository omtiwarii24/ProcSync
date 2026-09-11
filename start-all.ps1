# ============================================================================
# ProcSync (GovInnovate / SIH26136) - One-shot full-stack launcher
#
# Usage (from this folder):
#   powershell -ExecutionPolicy Bypass -File .\start-all.ps1
#
# Starts (skipping anything already up):
#   1. Docker Postgres (govinnovate-db, :15433) - launches Docker Desktop if needed
#   2. Database migrations (alembic upgrade head)
#   3. Demo seed data (skips automatically if already seeded)
#   4. FastAPI backend on :8000
#   5. Login :3002, Gov :3000, Startup :3001 portals
#
# Stop everything:  .\stop-all.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

$Root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$VenvPy  = Join-Path $Backend ".venv\Scripts\python.exe"

$Apps = @(
  @{ Name = "Login Gateway";   Port = 3002; Dir = Join-Path $Root "Pilot Bridge\pilotbridge-login" },
  @{ Name = "Gov Portal";      Port = 3000; Dir = Join-Path $Root "Pilot Bridge\pilotbridge-gov" },
  @{ Name = "Startup Portal";  Port = 3001; Dir = Join-Path $Root "Pilot Bridge\pilotbridge-startup" }
)

function Test-PortOpen([int]$port) {
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $ok = $tcp.ConnectAsync("127.0.0.1", $port).Wait(600) -and $tcp.Connected
    $tcp.Close()
    return $ok
  } catch { return $false }
}

function Wait-Port([int]$port, [int]$timeoutSec) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen $port) { return $true }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

if (-not (Test-Path $VenvPy)) {
  throw "Backend venv missing ($VenvPy). Run the one-time setup in backend\README.md first."
}

Write-Host ""
Write-Host "=========== ProcSync stack launcher ===========" -ForegroundColor Cyan

# --- 1) Postgres on :15433 ---------------------------------------------------
if (Test-PortOpen 15433) {
  Write-Host "[1/5] Postgres already running (:15433)" -ForegroundColor Green
} else {
  Write-Host "[1/5] Starting Docker + Postgres..." -ForegroundColor Yellow
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    $dd = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dd)) { throw "Docker Desktop not found. Start it manually, then re-run." }
    Start-Process $dd
    $deadline = (Get-Date).AddSeconds(150)
    while ((Get-Date) -lt $deadline) {
      docker info *> $null
      if ($LASTEXITCODE -eq 0) { break }
      Start-Sleep -Seconds 5
    }
    if ($LASTEXITCODE -ne 0) { throw "Docker engine did not start within 150s." }
  }
  Push-Location $Backend
  docker compose up -d db
  Pop-Location
  if (-not (Wait-Port 15433 60)) { throw "Postgres did not become ready on :15433." }
  Write-Host "      Postgres up (:15433)" -ForegroundColor Green
}

# --- 2) Migrations -----------------------------------------------------------
Push-Location $Backend
Write-Host "[2/5] Applying DB migrations..." -ForegroundColor Yellow
& $VenvPy -m alembic upgrade head
if ($LASTEXITCODE -ne 0) { throw "alembic upgrade head failed." }
Write-Host "      migrations OK" -ForegroundColor Green

# --- 3) Seed (idempotent: skips if already seeded) ----------------------------
Write-Host "[3/5] Seeding demo data (no-op if already seeded)..." -ForegroundColor Yellow
& $VenvPy -m scripts.seed
if ($LASTEXITCODE -ne 0) { throw "seed failed." }
Pop-Location

# --- 4) FastAPI backend on :8000 ----------------------------------------------
if (Test-PortOpen 8000) {
  Write-Host "[4/5] Backend API already running (:8000)" -ForegroundColor Green
} else {
  Write-Host "[4/5] Starting FastAPI backend on :8000..." -ForegroundColor Yellow
  Start-Process -FilePath $VenvPy -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000" -WorkingDirectory $Backend
  if (-not (Wait-Port 8000 30)) { throw "Backend did not start on :8000." }
  Write-Host "      backend up (:8000)" -ForegroundColor Green
}

# --- 5) Portals ---------------------------------------------------------------
foreach ($app in $Apps) {
  if (Test-PortOpen $app.Port) {
    Write-Host "[5/5] $($app.Name) already running (:$($app.Port))" -ForegroundColor Green
  } else {
    Write-Host "[5/5] Starting $($app.Name) on :$($app.Port)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "title ProcSync $($app.Name) && npm run dev" -WorkingDirectory $app.Dir
    if (-not (Wait-Port $app.Port 90)) { throw "$($app.Name) did not start on :$($app.Port)." }
    Write-Host "      $($app.Name) up (:$($app.Port))" -ForegroundColor Green
  }
}

# --- Health check + summary ----------------------------------------------------
Start-Sleep -Seconds 2
$api = "n/a"
try { $api = (Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 5).status } catch {}

Write-Host ""
Write-Host "===================== READY =====================" -ForegroundColor Cyan
Write-Host "  Login Gateway .. http://localhost:3002   <- start here"
Write-Host "  Gov Portal ..... http://localhost:3000"
Write-Host "  Startup Portal . http://localhost:3001"
Write-Host "  Backend API .... http://localhost:8000  (health: $api, docs: /docs)"
Write-Host ""
Write-Host "  Demo sign-in password: procsync@2026"
Write-Host "    DIPP99421 ..... Startup founder   (founder@acoustileak.in)"
Write-Host "    NMC-CE-2201 ... Dept owner Nashik (ce.nashik@nmc.gov.in)"
Write-Host "    COEP-HYD-007 .. Evaluator COEP    (hyd.coep@coep.ac.in)"
Write-Host "    PMC-FA-1104 ... Finance           (ca.pmc@pmc.gov.in)"
Write-Host "    MSINS-ADM-001 . Admin             (admin@procsync.gov.in)"
Write-Host ""
Write-Host "  Stop everything:  .\stop-all.ps1"
Write-Host "=================================================" -ForegroundColor Cyan
