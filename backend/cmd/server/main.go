package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"3d-model-generator-backend/config"
	"3d-model-generator-backend/internal/cache"
	"3d-model-generator-backend/internal/evaluation"
	"3d-model-generator-backend/internal/handlers"
	"3d-model-generator-backend/internal/middleware"
	"3d-model-generator-backend/internal/models"
	"3d-model-generator-backend/internal/services"
	"3d-model-generator-backend/pkg/tencentcloud"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化数据库
	db := initDatabase(cfg.Database.DSN)

	// 初始化Redis
	redisClient := initRedis(cfg.Redis)

	// 初始化缓存服务
	cacheService := cache.NewCacheService(redisClient, db)

	// 初始化腾讯云客户端
	tencentClient, err := initTencentClient(cfg.Tencent)
	if err != nil {
		log.Fatalf("Failed to initialize Tencent client: %v", err)
	}

	// 初始化服务
	generationService := services.NewGenerationService(db, cacheService, tencentClient)
	evaluationService := evaluation.NewEvaluationService(db)
	authService := services.NewAuthService(db, cfg.Auth.JWTSecret)

	// 初始化处理器
	generationHandler := handlers.NewGenerationHandler(generationService)
	evaluationHandler := handlers.NewEvaluationHandler(evaluationService)
	authHandler := handlers.NewAuthHandler(authService)

	// 初始化Gin
	router := setupRouter(generationHandler, evaluationHandler, authHandler, authService, redisClient, cfg)

	// 启动服务器
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Server starting on %s", addr)

	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initDatabase(dsn string) *gorm.DB {
	// 使用纯Go的SQLite数据库驱动
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 自动迁移
	err = db.AutoMigrate(
		&models.GenerationJob{},
		&models.User{},
		&models.Evaluation{},
		&models.CacheEntry{},
		&models.APIUsage{},
		&evaluation.ABTest{},
		&evaluation.ABTestAssignment{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func initRedis(cfg config.RedisConfig) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
		log.Println("Server will continue without Redis (rate limiting disabled)")
		return nil
	}

	log.Println("Redis connected successfully")
	return client
}

func initTencentClient(cfg config.TencentConfig) (*tencentcloud.Client, error) {
	tencentConfig := tencentcloud.TencentConfig{
		SecretId:  cfg.SecretId,
		SecretKey: cfg.SecretKey,
		Region:    cfg.Region,
	}

	return tencentcloud.NewClient(tencentConfig)
}

func setupRouter(
	generationHandler *handlers.GenerationHandler,
	evaluationHandler *handlers.EvaluationHandler,
	authHandler *handlers.AuthHandler,
	authService *services.AuthService,
	redisClient *redis.Client,
	cfg *config.Config,
) *gin.Engine {
	// 设置Gin模式
	if gin.Mode() == gin.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// 健康检查 - 放在中间件之前，避免Redis依赖
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Unix(),
			"version":   "v1.0.0",
		})
	})

	// 中间件
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.RequestID())
	router.Use(middleware.Security())

	// 只有在Redis连接成功时才添加限流中间件
	if redisClient != nil {
		router.Use(middleware.RateLimit(redisClient, 100, time.Minute))
	}

	// API路由组
	v1 := router.Group("/api/v1")
	{
		// 认证相关路由（不需要认证）
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
		}

		// 需要认证的路由组
		authenticated := v1.Group("")
		authenticated.Use(middleware.AuthMiddleware(authService))
		{
			// 用户资料管理
			profile := authenticated.Group("/auth")
			{
				profile.GET("/profile", authHandler.GetProfile)
				profile.PUT("/profile", authHandler.UpdateProfile)
				profile.POST("/change-password", authHandler.ChangePassword)
			}

			// 生成相关路由
			generation := authenticated.Group("/generate")
			{
				generation.POST("/text", generationHandler.GenerateFromText)
				generation.POST("/image", generationHandler.GenerateFromImage)
				generation.POST("/uploaded-image", generationHandler.GenerateFromUploadedImage)
			}

			// 文件上传路由
			upload := authenticated.Group("/upload")
			{
				upload.POST("/image", generationHandler.UploadImage)
			}

			// 任务相关路由
			jobs := authenticated.Group("/jobs")
			{
				jobs.GET("/:job_id", generationHandler.GetJobStatus)
				jobs.GET("/:job_id/download", generationHandler.DownloadModel)
				jobs.GET("", generationHandler.GetUserJobs)
			}

			// 评估相关路由
			evaluations := authenticated.Group("/evaluations")
			{
				evaluations.POST("", evaluationHandler.SubmitEvaluation)
				evaluations.GET("/stats", evaluationHandler.GetEvaluationStats)
				evaluations.GET("", evaluationHandler.GetUserEvaluations)
			}

			// 任务评估路由
			jobs.GET("/:job_id/evaluation", evaluationHandler.GetJobEvaluation)

			// A/B测试路由
			abTests := authenticated.Group("/ab-tests")
			{
				abTests.POST("", evaluationHandler.CreateABTest)
				abTests.GET("/:test_name/result", evaluationHandler.GetABTestResult)
			}

			// 统计路由
			authenticated.GET("/statistics", generationHandler.GetStatistics)
		}
	}

	// 静态文件服务（用于文档和上传文件）
	router.Static("/docs", "./docs")
	router.Static("/uploads", "./uploads")

	return router
}

// 优雅关闭
func gracefulShutdown(router *gin.Engine) {
	// 这里可以实现优雅关闭逻辑
	// 例如：等待正在处理的请求完成，然后关闭服务器
}
