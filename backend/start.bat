@echo off
echo ========================================
echo 3D Model Generator Backend
echo ========================================
echo.

REM 检查Go是否安装
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

echo Go version:
go version
echo.

REM 检查配置文件
if not exist "config.json" (
    echo Warning: config.json not found, using default configuration
    echo.
)

REM 下载依赖
echo Downloading dependencies...
go mod tidy
go mod download
if %errorlevel% neq 0 (
    echo Error: Failed to download dependencies
    pause
    exit /b 1
)

echo.

REM 检查端口占用
echo Checking port 8080...
netstat -ano | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo Warning: Port 8080 is already in use
    echo Killing existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 >nul
)

echo Starting server...
echo Server will be available at: http://localhost:8080
echo Health check: http://localhost:8080/health
echo API documentation: http://localhost:8080/api/v1
echo.
echo Press Ctrl+C to stop the server
echo.

REM 运行简化版服务器（避免CGO依赖问题）
go run cmd/server/main_simple.go

pause
