package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/Chen-cc11/qiniu/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TaskHandler 任务处理器
type TaskHandler struct {
	taskService *service.TaskService
}

// NewTaskHandler 创建新的任务处理器
func NewTaskHandler(taskService *service.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

// GenerateFromText
//
// @Description: 从文本生成3D模型
func (h *TaskHandler) GenerateFromText(c *gin.Context) {
	var req struct {
		Prompt string `json:"prompt" form:"prompt" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}
	// 修正: 获取用户ID（从JWT token中解析） - 与中间件中的 "userID" 保持一致
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User is Unauthorized",
		})
		return
	}
	// 创建任务
	task, err := h.taskService.CreateTextTask(c.Request.Context(), userID.(string), req.Prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create task",
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"taskID":  task.ID,
		"status":  task.Status,
		"message": "The task has been created and is currently being processed ..",
	})
}

// GenerateFromImage
//
// @Description: 从图片生成3D模型
func (h *TaskHandler) GenerateFromImage(c *gin.Context) {
	// 修正: 获取用户ID - 与中间件中的 "userID" 保持一致
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User is Unauthorized",
		})
		return
	}

	// 修正: 正确处理文件上传逻辑
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": "please upload picture file",
		})
		return
	}

	// 生成唯一文件名以避免冲突
	extension := filepath.Ext(file.Filename)
	newFileName := uuid.New().String() + extension
	dst := filepath.Join("./uploads", newFileName) // 保存到预定义的 'uploads' 目录

	// 保存文件到服务器
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save uploaded file",
			"message": err.Error(),
		})
		return
	}

	// 构建可供访问的文件URL
	// 注意: 这里的URL需要与 main.go 中配置的静态文件服务路径匹配
	imageURL := fmt.Sprintf("http://%s/uploads/%s", c.Request.Host, newFileName)

	// 创建任务
	task, err := h.taskService.CreateImageTask(c.Request.Context(), userID.(string), imageURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create task",
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"taskID":  task.ID,
		"status":  task.Status,
		"message": "The task has been created and is currently being processed ..",
	})
}

// GetTask
//
// @Description: 获取任务详情
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing task ID",
		})
		return
	}
	task, err := h.taskService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Task not found",
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"task": task,
	})
}

// GetTaskStatus 获取任务状态
func (h *TaskHandler) GetTaskStatus(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing task ID",
		})
		return
	}

	task, err := h.taskService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Task not found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"task_id":       task.ID,
		"status":        task.Status,
		"progress":      getProgressFromStatus(task.Status),
		"result_url":    task.ResultURL,
		"thumbnail_url": task.ThumbnailURL,
		"error_message": task.ErrorMessage,
		"created_at":    task.CreateAt,
		"updated_at":    task.UpdateAt,
	})
}

// GetUserTasks 获取用户任务列表
func (h *TaskHandler) GetUserTasks(c *gin.Context) {
	// 修正: 获取用户ID - 与中间件中的 "userID" 保持一致
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// 解析分页参数
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// 获取任务列表
	tasks, err := h.taskService.GetUserTasks(c.Request.Context(), userID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get tasks",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks":  tasks,
		"limit":  limit,
		"offset": offset,
		"count":  len(tasks),
	})
}

// getProgressFromStatus 根据状态获取进度
func getProgressFromStatus(status string) int {
	switch status {
	case "pending":
		return 0
	case "processing":
		return 50
	case "completed":
		return 100
	case "failed":
		return 0
	default:
		return 0
	}
}