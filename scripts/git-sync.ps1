# =========================================================================
# SALAM LMS — STAI AL-ITTIHAD CIANJUR
# Git Auto-Sync Helper Script
# =========================================================================

param (
    [string]$Message = "chore: auto-sync updates to GitHub"
)

Write-Host "[SALAM GIT] Melakukan staging seluruh perubahan..." -ForegroundColor Cyan
git add .

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[SALAM GIT] Tidak ada perubahan baru yang perlu di-commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "[SALAM GIT] Membuat commit dengan pesan: '$Message'..." -ForegroundColor Cyan
git commit -m $Message

Write-Host "[SALAM GIT] Melakukan push ke origin main..." -ForegroundColor Green
git push origin main

Write-Host "[SALAM GIT] Berhasil melakukan sinkronisasi ke GitHub!" -ForegroundColor Green
