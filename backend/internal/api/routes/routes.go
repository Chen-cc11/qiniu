package routes

import (
	"github.com/Chen-cc11/qiniu/backend/internal/api/handlers"
	"github.com/Chen-cc11/qiniu/backend/internal/api/middle"
	"github.com/gin-gonic/gin"
)

// SetupRoutes
//
// @Description: 设置路由
func SetupRoutes(r *gin.Engine, taskHandler *handlers.TaskHandler, authMiddleware *middle.AuthMiddleware) {
	
	// --- 最终修复：统一所有API到 /api 路径下 ---
	// 这样可以简化前端代理，并确保路由匹配的确定性。
	api := r.Group("/api")
	{
		// 健康检查
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"message": "Tripo3D Backend is running",
			})
		})

		// --- 将所有需要认证的路由也放在 /api 组内 ---
		// 注意: 这里不再需要新建一个 'authorized' 分组，直接在 'api' 分组上应用中间件即可
		api.Use(authMiddleware.RequireAuth())
		
		// 3D模型生成
		api.POST("/generate/text", taskHandler.GenerateFromText)
		api.POST("/generate/image", taskHandler.GenerateFromImage)

		// 任务管理
		api.GET("/tasks", taskHandler.GetUserTasks)
		api.GET("/tasks/:id", taskHandler.GetTask)
		api.GET("/tasks/:id/status", taskHandler.GetTaskStatus)
	}

	// 静态文件服务（用于上传的文件）
	// 注意：这个路径保持在根路径，以便直接通过 http://localhost:8080/uploads/filename.jpg 访问
	r.Static("/uploads", "./uploads")
}