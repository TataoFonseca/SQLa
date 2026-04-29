# ============================================================
# build-installer.ps1
# Genera el instalador SQLa-Setup.exe completo.
# Uso: ejecutar desde la carpeta /installer o desde la raiz del repo.
# ============================================================

$ErrorActionPreference = "Stop"
$root    = Split-Path $PSScriptRoot -Parent
$appDir  = Join-Path $root "Sqla - Proyecto de Grado\sqla-app"
$backDir = Join-Path $root "Sqla - Proyecto de Grado\sqla-backend"
$outDir  = Join-Path $PSScriptRoot "output"
$issFile = Join-Path $PSScriptRoot "sqla-installer.iss"

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Fail($msg) {
    Write-Host "`n[ERROR] $msg" -ForegroundColor Red
    exit 1
}

# ── 0. Verificar herramientas necesarias ────────────────────
Write-Step "Verificando herramientas..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Node.js no encontrado. Instala Node.js >= 18." }
if (-not (Get-Command npm  -ErrorAction SilentlyContinue)) { Fail "npm no encontrado." }

# Verificar @yao-pkg/pkg (fork con soporte ESM para Node 18+)
$pkgCmd = Get-Command "@yao-pkg/pkg" -ErrorAction SilentlyContinue
if (-not $pkgCmd) {
    # Buscar también el binario que instala el paquete (se llama "pkg" igual)
    $pkgCmd = Get-Command pkg -ErrorAction SilentlyContinue
}
if (-not $pkgCmd) {
    Write-Host "  @yao-pkg/pkg no encontrado. Instalando globalmente..." -ForegroundColor Yellow
    npm install -g @yao-pkg/pkg
    if ($LASTEXITCODE -ne 0) { Fail "No se pudo instalar @yao-pkg/pkg." }
}

# Verificar Inno Setup (ISCC.exe) — busca versiones 5, 6 y 7 en C:, D: y E:
$iscc = $null

# 1. Si está en el PATH del sistema, usarlo directamente
$isccCmd = Get-Command ISCC -ErrorAction SilentlyContinue
if ($isccCmd) { $iscc = $isccCmd.Source }

# 2. Si no está en PATH, buscar en rutas comunes
if (-not $iscc) {
    $drives   = @("C:", "D:", "E:")
    $x86dirs  = @("Program Files (x86)", "Program Files")
    $versions = @("Inno Setup 7", "Inno Setup 6", "Inno Setup 5")
    :search foreach ($drv in $drives) {
        foreach ($dir in $x86dirs) {
            foreach ($ver in $versions) {
                $candidate = "$drv\$dir\$ver\ISCC.exe"
                if (Test-Path $candidate) { $iscc = $candidate; break search }
            }
        }
    }
}

if (-not $iscc) {
    Fail "Inno Setup no encontrado.`nDescargalo desde https://jrsoftware.org/isdl.php e instalalo."
}

Write-Host "  Node.js : OK" -ForegroundColor Green
Write-Host "  pkg     : OK (@yao-pkg/pkg)" -ForegroundColor Green
Write-Host "  ISCC    : $iscc" -ForegroundColor Green

# ── 1. Instalar dependencias del frontend ───────────────────
Write-Step "Instalando dependencias del frontend..."
Set-Location $appDir
npm install
if ($LASTEXITCODE -ne 0) { Fail "npm install falló en sqla-app." }

# ── 2. Build del frontend (Vite) ────────────────────────────
Write-Step "Generando build de producción del frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { Fail "vite build falló." }
Write-Host "  dist/ generado en $appDir\dist" -ForegroundColor Green

# ── 3. Instalar dependencias del backend ────────────────────
Write-Step "Instalando dependencias del backend..."
Set-Location $backDir
npm install
if ($LASTEXITCODE -ne 0) { Fail "npm install falló en sqla-backend." }

# ── 4. Empaquetar backend con @yao-pkg/pkg ──────────────────
Write-Step "Empaquetando backend como ejecutable (.exe)..."
Set-Location $PSScriptRoot

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# @yao-pkg/pkg se instala como "pkg" en el PATH
pkg "$backDir\src\server.js" `
    --config "$PSScriptRoot\pkg.config.json" `
    --target node18-win-x64 `
    --output "$outDir\sqla-server.exe" `
    --compress GZip
if ($LASTEXITCODE -ne 0) { Fail "pkg falló al empaquetar el backend." }
Write-Host "  sqla-server.exe generado en $outDir" -ForegroundColor Green

# ── 5. Copiar archivos al output ────────────────────────────
Write-Step "Copiando archivos al directorio de salida..."

# Frontend build (dist/) — se instala junto al .exe, express.static lo lee desde ahí
$distOut = Join-Path $outDir "dist"
if (Test-Path $distOut) { Remove-Item $distOut -Recurse -Force }
Copy-Item (Join-Path $appDir "dist") $distOut -Recurse
Write-Host "  dist/ copiado" -ForegroundColor Green

# Scripts de base de datos
$dbScriptsOut = Join-Path $outDir "db-scripts"
if (Test-Path $dbScriptsOut) { Remove-Item $dbScriptsOut -Recurse -Force }
Copy-Item (Join-Path $root "Sqla - Proyecto de Grado\db-scripts") $dbScriptsOut -Recurse
Write-Host "  db-scripts copiados" -ForegroundColor Green

# ── 6. Compilar el instalador con Inno Setup ────────────────
Write-Step "Compilando instalador con Inno Setup..."
& $iscc $issFile
if ($LASTEXITCODE -ne 0) { Fail "Inno Setup falló al compilar el instalador." }

$setupExe = Join-Path $outDir "SQLa-Setup.exe"
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Instalador listo: $setupExe" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green
