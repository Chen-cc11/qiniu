package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/Chen-cc11/qiniu/backend/internal/api/handlers"
	"github.com/Chen-cc11/qiniu/backend/internal/api/middle"
	"github.com/Chen-cc11/qiniu/backend/internal/api/routes"
	"github.com/Chen-cc11/qiniu/backend/internal/models"
	"github.com/Chen-cc11/qiniu/backend/internal/repository"
	"github.com/Chen-cc11/qiniu/backend/internal/service"
	"github.com/Chen-cc11/qiniu/backend/pkg/cache"
	"github.com/Chen-cc11/qiniu/backend/pkg/tripo"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}
	db, err := initDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	redisClient, err := initRedis()
	if err != nil {
		log.Fatalf("Failed to initialize redis: %v", err)
	}
	tripoClient := tripo.NewTripoClient(
		os.Getenv("TRIPO_API_KEY"),
		os.Getenv("TRIPO_BASE_URL"),
	)
	cacheManager := cache.NewCacheManager(redisClient)
	taskRepo := repository.NewTaskRepository(db)
	taskService := service.NewTaskService(tripoClient, taskRepo, cacheManager, 5)
	taskHandler := handlers.NewTaskHandler(taskService)
	authMiddleware := middle.NewAuthMiddleware()

	// 初始化路由
	router := gin.Default()
	routes.SetupRoutes(router, taskHandler, authMiddleware)

	// 启动服务器
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

// initDatabase 初始化数据库
func initDatabase() (*gorm.DB, error) {
	dsn := buildDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// 自动迁移
	if err := db.AutoMigrate(&models.User{}, &models.Task{}, &models.Feedback{}); err != nil {
		return nil, err
	}
	return db, nil
}

// buildDSN 构建数据库连接字符串
func buildDSN() string {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "password")
	dbname := getEnv("DB_NAME", "tripo3d_backend")

	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// initRedis 初始化Redis
func initRedis() (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       0,
	})
	// 测试连接
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return client, nil
}
