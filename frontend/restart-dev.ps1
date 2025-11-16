# Script to restart Next.js dev server with clean cache
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow

# Kill any node processes running Next.js (be careful with this)
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*frontend*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
        Write-Host ".next folder cleared" -ForegroundColor Green
    } catch {
        Write-Host "Could not fully clear .next folder (may be in use)" -ForegroundColor Yellow
    }
}

Write-Host "Starting Next.js dev server..." -ForegroundColor Green
npm run dev

