# PowerShell script to run the 3D Model Generator Backend
Write-Host "Starting 3D Model Generator Backend..." -ForegroundColor Green

# 设置环境变量
$env:CGO_ENABLED = "1"
$env:GO111MODULE = "on"
$env:GOPROXY = "https://goproxy.cn,direct"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "CGO_ENABLED=$env:CGO_ENABLED"
Write-Host "GO111MODULE=$env:GO111MODULE"
Write-Host "GOPROXY=$env:GOPROXY"

Write-Host "`nRunning server..." -ForegroundColor Green
go run cmd/server/main.go
