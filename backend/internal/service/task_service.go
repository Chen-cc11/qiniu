package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/Chen-cc11/qiniu/backend/internal/models"
	"github.com/Chen-cc11/qiniu/backend/internal/repository"
	"github.com/Chen-cc11/qiniu/backend/pkg/cache"
	"github.com/Chen-cc11/qiniu/backend/pkg/tripo"
)

// TaskService 人物列表
type TaskService struct {
	tripoClient *tripo.TripoClient
	taskRepo    repository.TaskRepository
	cache       cache.CacheManager
	taskQueue   chan *models.Task
	workers     int
	mu          sync.RWMutex
}

// NewTaskService 创建新的任务服务
func NewTaskService(tripoClient *tripo.TripoClient, taskRepo repository.TaskRepository, cache cache.CacheManager, workers int) *TaskService {
	service := &TaskService{
		tripoClient: tripoClient,
		taskRepo:    taskRepo,
		cache:       cache,
		taskQueue:   make(chan *models.Task, 100),
		workers:     workers,
	}
	// 启动工作协程
	for i := 0; i < service.workers; i++ {
		go service.worker(i)
	}
	return service
}

// CreateTextTask
//
// @Description: 创建文本转3D任务
func (s *TaskService) CreateTextTask(ctx context.Context, userID, prompt string) (*models.Task, error) {
	inputHash := s.generateInputHash("text", prompt)

	// 检查缓存
	if cachedTask := s.cache.GetTask(inputHash); cachedTask != nil {
		// 创建新任务记录，但使用缓存的结果
		task := &models.Task{
			UserID:       userID,
			InputType:    "text",
			InputContent: prompt,
			InputHash:    inputHash,
			Status:       "completed",
			ResultURL:    cachedTask.ResultURL,
			ThumbnailURL: cachedTask.ThumbnailURL,
		}
		if err := s.taskRepo.Create(task); err != nil {
			return nil, fmt.Errorf("failed to create cached task: %w", err)
		}
		return task, nil
	}
	// 创建新任务
	task := &models.Task{
		UserID:       userID,
		InputType:    "text",
		InputContent: prompt,
		InputHash:    inputHash,
		Status:       "pending",
	}
	if err := s.taskRepo.Create(task); err != nil {
		return nil, fmt.Errorf("failed to create cached task: %w", err)
	}
	// 推送到任务队列
	select {
	case s.taskQueue <- task:
	default:
		log.Printf("task queue is full, dropping task %s", task.ID)
	}
	return task, nil
}

// CreateImageTask
//
// @Description: 创建图片转3D任务
func (s *TaskService) CreateImageTask(ctx context.Context, userID, imageURL string) (*models.Task, error) {
	inputHash := s.generateInputHash("image", imageURL)
	// 检查缓存
	if cachedTask := s.cache.GetTask(inputHash); cachedTask != nil {
		// 创建新任务记录，但使用缓存的结果
		task := &models.Task{
			UserID:       userID,
			InputType:    "image",
			InputContent: imageURL,
			InputHash:    inputHash,
			Status:       "completed",
			ResultURL:    cachedTask.ResultURL,
			ThumbnailURL: cachedTask.ThumbnailURL,
		}
		if err := s.taskRepo.Create(task); err != nil {
			return nil, fmt.Errorf("failed to create cached task: %w", err)
		}
		return task, nil
	}
	// 创建新任务
	task := &models.Task{
		UserID:       userID,
		InputType:    "image",
		InputContent: imageURL,
		InputHash:    inputHash,
		Status:       "pending",
	}
	if err := s.taskRepo.Create(task); err != nil {
		return nil, fmt.Errorf("failed to create cached task: %w", err)
	}
	// 推送到任务队列
	select {
	case s.taskQueue <- task:
	default:
		log.Printf("task queue is full, dropping task %s", task.ID)
	}
	return task, nil
}

// GetTask
//
// @Description: 获取任务队列
func (s *TaskService) GetTask(ctx context.Context, taskID string) (*models.Task, error) {
	return s.taskRepo.GetByID(taskID)
}

// GetUserTasks
//
// @Description: 获取用户的人物列表
func (s *TaskService) GetUserTasks(ctx context.Context, userID string, limit, offset int) ([]*models.Task, error) {
	return s.taskRepo.GetByUserID(userID, limit, offset)
}

// worker 工作协程
func (s *TaskService) worker(workerID int) {
	for task := range s.taskQueue {
		log.Printf("Task #%d: Processing task #%s", workerID, task.ID)
		s.processTask(task)
	}
}

// processTask 处理任务
func (s *TaskService) processTask(task *models.Task) {
	ctx := context.Background()
	// 更新状态为processing
	if err := s.taskRepo.UpdateStatus(task.ID, "processing"); err != nil {
		log.Printf("Failed to update task status to processing: %v", err)
		return
	}
	var resp *models.TripoTaskResponse
	var err error

	// 调用Tripo3D API
	if task.InputType == "text" {
		req := models.TextToModelRequest{
			Prompt:         task.InputContent,
			ModelVersion:   "v2.5-20250123",
			FaceLimit:      8000,
			Texture:        true,
			PBR:            true,
			TextureQuality: "standard",
		}
		resp, err = s.tripoClient.CreateTextToModelTask(ctx, req)
	} else if task.InputType == "image" {
		req := models.ImageToModelRequest{
			URL:              task.InputContent,
			ModelVersion:     "v2.5-20250123",
			FaceLimit:        8000,
			Texture:          true,
			PBR:              true,
			TextureQuality:   "standard",
			TextureAlignment: "original_image",
		}
		resp, err = s.tripoClient.CreateImageToModelTask(ctx, req)
	} else {
		// 处理未知的 InputType
		log.Printf("Unsupported input type: %s", task.InputType)
		_ = s.taskRepo.UpdateStatus(task.ID, "failed")
		_ = s.taskRepo.UpdateError(task.ID, fmt.Sprintf("Unsupported input type: %s", task.InputType))
		return
	}
	if err != nil {
		log.Printf("Failed to update task status to processing: %v", err)
		_ = s.taskRepo.UpdateStatus(task.ID, "failed")
		_ = s.taskRepo.UpdateError(task.ID, err.Error())
		return
	}
	if resp == nil {
		log.Printf("Tripo3D API returned nil response")
		_ = s.taskRepo.UpdateStatus(task.ID, "failed")
		_ = s.taskRepo.UpdateError(task.ID, "API returned nil response")
		return
	}
	if resp.Code != 0 {
		log.Printf("Tripo3D API returned error: %s", resp.Msg)
		_ = s.taskRepo.UpdateStatus(task.ID, "failed")
		_ = s.taskRepo.UpdateError(task.ID, resp.Msg)
		return
	}

	// 保存Tripo3D任务ID
	if err := s.taskRepo.UpdateTripoTaskID(task.ID, resp.Data.TaskID); err != nil {
		log.Printf("Failed to update Tripo3D task ID: %v", err)
	}
	// pollTaskStatus 轮询任务状态
	s.pollTaskStatus(task.ID, resp.Data.TaskID)
}

// pollTaskStatus 轮询任务状态
func (s *TaskService) pollTaskStatus(taskID, tripoTaskID string) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	ctx := context.Background()

	for {
		select {
		case <-ticker.C:
			resp, err := s.tripoClient.GetTaskStatus(ctx, tripoTaskID)
			if err != nil {
				log.Printf("Failed to get task status: %v", err)
				continue
			}
			if resp.Code != 0 {
				log.Printf("Failed to get task status: %s", resp.Msg)
				continue
			}
			status := resp.Data.Status
			progress := resp.Data.Progress

			log.Printf("Task %s status: %s. progress: %d", taskID, status, progress)

			switch status {
			case "success":
				// 任务完成
				resultURL := resp.Data.Result.ModelURL
				thumbnailURL := resp.Data.Result.ThumbnailURL

				if err := s.taskRepo.UpdateStatus(taskID, "completed"); err != nil {
					log.Printf("Failed to update task status to completed: %v", err)
					return
				}
				if err := s.taskRepo.UpdateResult(taskID, resultURL, thumbnailURL); err != nil {
					log.Printf("Failed to update task result: %v", err)
					return
				}
				// 缓存结果
				task, err := s.taskRepo.GetByID(taskID)
				if err == nil {
					s.cache.SetTask(task.InputHash, task)
				}
				log.Printf("Task %s completed successfully", taskID)
				return
			case "failed":
				// 任务失败
				errorMsg := resp.Data.Error
				if errorMsg == "" {
					errorMsg = "Tripo3D task failed"
				}
				_ = s.taskRepo.UpdateStatus(taskID, "failed")
				_ = s.taskRepo.UpdateError(taskID, errorMsg)
				log.Printf("Task %s failed: %s", taskID, errorMsg)
				return
			case "processing":
				// 继续轮询
				continue
			default:
				log.Printf("Unknown task status: %s", status)
				continue
			}
		}
	}
}

// generateInputHash 生成输入内容的哈希值
func (s *TaskService) generateInputHash(inputType, content string) string {
	h := sha256.New()
	h.Write([]byte(fmt.Sprintf("%s:%s", inputType, content)))
	return hex.EncodeToString(h.Sum(nil))
}
