package routes

import (
	"github.com/Chen-cc11/qiniu/backend/internal/api/handlers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes
//
// @Description: 设置路由
func SetupRoutes(r *gin.Engine, taskHandler *handlers.TaskHandler, authMiddleware *middleware.AuthMiddleware) {
	// API 路由组
	api := r.Group("/api")
	// 健康检查
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Tripo3D Backend is running",
		})
	})
	// 需要认证的路由
	authorized := r.Group("/")
	authorized.Use(authMiddleware.RequireAuth())
	{
		// 3D模型生成
		authorized.POST("/generate/text", taskHandler.GenerateFromText)
		authorized.POST("/generate/image", taskHandler.GenerateFromImage)

		// 任务管理
		authorized.GET("/tasks", taskHandler.GetUserTasks)
		authorized.GET("/tasks/:id", taskHandler.GetTask)
		authorized.GET("/tasks/:id/status", taskHandler.GetTaskStatus)
	}
	// 静态文件服务（用于上传的文件）
	r.Static("/uploads", "./uploads")
}
