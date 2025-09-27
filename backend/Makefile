# Makefile for 3D Model Generator Backend

.PHONY: help build run clean test deps dev

# 默认目标
help:
	@echo "Available commands:"
	@echo "  make deps     - Download dependencies"
	@echo "  make build    - Build the application"
	@echo "  make run      - Run the application"
	@echo "  make dev      - Run in development mode"
	@echo "  make test     - Run tests"
	@echo "  make clean    - Clean build artifacts"

# 下载依赖
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# 构建应用
build:
	@echo "Building application..."
	set CGO_ENABLED=1 && go build -o bin/server.exe cmd/server/main.go

# 运行应用
run:
	@echo "Running application..."
	set CGO_ENABLED=1 && go run cmd/server/main.go

# 开发模式运行
dev:
	@echo "Running in development mode..."
	set CGO_ENABLED=1 && set GIN_MODE=debug && go run cmd/server/main.go

# 运行测试
test:
	@echo "Running tests..."
	set CGO_ENABLED=1 && go test ./...

# 清理构建文件
clean:
	@echo "Cleaning build artifacts..."
	if exist bin rmdir /s /q bin
	if exist *.exe del *.exe
