@echo off
echo Starting 3D Model Generator Backend...

REM 设置CGO_ENABLED=1以支持SQLite
set CGO_ENABLED=1

REM 设置Go模块模式
set GO111MODULE=on

REM 设置Go代理（可选，加速依赖下载）
set GOPROXY=https://goproxy.cn,direct

echo Environment variables set:
echo CGO_ENABLED=%CGO_ENABLED%
echo GO111MODULE=%GO111MODULE%
echo GOPROXY=%GOPROXY%

echo.
echo Running server...
go run cmd/server/main.go

pause
