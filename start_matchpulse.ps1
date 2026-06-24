Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "          STARTING MATCHPULSE            " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Start Backend Server
Write-Host "Launching MatchPulse Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start Frontend Dev Server
Write-Host "Launching MatchPulse React Frontend Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Both servers are starting up in separate terminal windows." -ForegroundColor Green
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
