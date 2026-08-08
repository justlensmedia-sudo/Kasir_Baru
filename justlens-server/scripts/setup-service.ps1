# Justlens Server - Windows Service & Firewall Installer Script
# Running this script requires Administrator privileges.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 Justlens Server - Windows Service & Firewall Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Script ini harus dijalankan sebagai Administrator!" -ForegroundColor Red
    Write-Host "   Silakan klik kanan PowerShell -> 'Run as administrator'" -ForegroundColor Yellow
    Exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$exePath = Join-Path $scriptDir "justlens-server.exe"

if (-not (Test-Path $exePath)) {
    Write-Host "❌ File justlens-server.exe tidak ditemukan di: $exePath" -ForegroundColor Red
    Exit 1
}

# 2. Configure Windows Firewall (Allow Port 5000 for LAN Access)
Write-Host "`n🛡️ Step 1: Membuka Port 5000 di Windows Firewall..." -ForegroundColor Yellow
try {
    # Remove existing rule if present
    netsh advfirewall firewall delete rule name="Justlens Server (Port 5000)" 2>$null | Out-Null
    
    # Add new inbound rule
    netsh advfirewall firewall add rule name="Justlens Server (Port 5000)" dir=in action=allow protocol=TCP localport=5000 profile=any | Out-Null
    Write-Host "✓ Windows Firewall Rule berhasil ditambahkan (Port 5000 Open for LAN)." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Gagal menambahkan aturan firewall secara otomatis: $_" -ForegroundColor Red
}

# 3. Register & Start Windows Service
Write-Host "`n⚙️ Step 2: Memasang Windows Service 'JustlensServer'..." -ForegroundColor Yellow

$serviceName = "JustlensServer"
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "ℹ️ Windows Service '$serviceName' sudah ada. Menghentikan service lama..." -ForegroundColor Cyan
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName | Out-Null
    Start-Sleep -Seconds 2
}

$nssmPath = Join-Path $scriptDir "nssm.exe"

if (Test-Path $nssmPath) {
    Write-Host "ℹ️ Menggunakan NSSM (Non-Sucking Service Manager)..." -ForegroundColor Cyan
    & $nssmPath install $serviceName "$exePath" | Out-Null
    & $nssmPath set $serviceName AppDirectory "$scriptDir" | Out-Null
    & $nssmPath set $serviceName DisplayName "Justlens Server API & Backoffice" | Out-Null
    & $nssmPath set $serviceName Description "Backend API & Admin UI Justlens Server (Port 5000)" | Out-Null
    & $nssmPath set $serviceName Start SERVICE_AUTO_START | Out-Null
    & $nssmPath start $serviceName | Out-Null
} else {
    Write-Host "ℹ️ Menggunakan PowerShell New-Service bawaan Windows..." -ForegroundColor Cyan
    New-Service -Name $serviceName `
                -BinaryPathName "`"$exePath`"" `
                -DisplayName "Justlens Server API & Backoffice" `
                -Description "Backend API & Admin UI Justlens Server (Port 5000)" `
                -StartupType Automatic | Out-Null
    Start-Service -Name $serviceName | Out-Null
}

Write-Host "✓ Windows Service '$serviceName' berhasil dipasang dan diaktifkan!" -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Selesai!" -ForegroundColor Green
Write-Host "📡 UI Admin        : http://localhost:5000" -ForegroundColor White
Write-Host "🌐 Network LAN Access: http://<IP-KOMPUTER>:5000" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
