# Justlens Server - Windows Service & Firewall Uninstall Script
# Running this script requires Administrator privileges.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🗑️ Justlens Server - Windows Service & Firewall Removal" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Script ini harus dijalankan sebagai Administrator!" -ForegroundColor Red
    Exit 1
}

# 2. Stop and Delete Windows Service
Write-Host "`n⚙️ Step 1: Menghentikan & Menghapus Windows Service 'JustlensServerService'..." -ForegroundColor Yellow

foreach ($sName in @("JustlensServerService", "JustlensServer")) {
    $existingService = Get-Service -Name $sName -ErrorAction SilentlyContinue
    if ($existingService) {
        Stop-Service -Name $sName -Force -ErrorAction SilentlyContinue
        sc.exe delete $sName | Out-Null
        Write-Host "✓ Windows Service '$sName' berhasil dihapus." -ForegroundColor Green
    }
}

# 3. Remove Windows Firewall Rule
Write-Host "`n🛡️ Step 2: Menghapus Aturan Firewall Port 5000..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="Justlens Server (Port 5000)" 2>$null | Out-Null
Write-Host "✓ Aturan Windows Firewall berhasil dibersihkan." -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "🎉 Uninstall Windows Service Selesai!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
