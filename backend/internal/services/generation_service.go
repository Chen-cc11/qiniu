package services

import (
	"context"
	"crypto/md5"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"3d-model-generator-backend/internal/cache"
	"3d-model-generator-backend/internal/models"
	"3d-model-generator-backend/pkg/tencentcloud"

	"gorm.io/gorm"
)

type GenerationService struct {
	db            *gorm.DB
	cache         *cache.CacheService
	tencentClient *tencentcloud.Client
}

func NewGenerationService(db *gorm.DB, cache *cache.CacheService, tencentClient *tencentcloud.Client) *GenerationService {
	return &GenerationService{
		db:            db,
		cache:         cache,
		tencentClient: tencentClient,
	}
}

// GenerateFromText 从文本生成3D模型
func (s *GenerationService) GenerateFromText(ctx context.Context, userID, prompt string, options *GenerationOptions) (*models.GenerationResponse, error) {
	// 检查缓存
	cacheKey := s.cache.GeneratePromptCacheKey(prompt)
	var cachedJob models.GenerationJob
	if err := s.cache.Get(ctx, cacheKey, &cachedJob); err == nil {
		// 返回缓存的结果
		return &models.GenerationResponse{
			JobID:   cachedJob.ID,
			Status:  cachedJob.Status,
			Message: "Generated from cache",
		}, nil
	}

	// 创建新的生成任务
	job := &models.GenerationJob{
		UserID:    userID,
		Prompt:    prompt,
		InputType: "text",
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存到数据库
	if err := s.db.Create(job).Error; err != nil {
		return nil, fmt.Errorf("failed to create generation job: %w", err)
	}

	// 异步提交到腾讯云
	go s.submitToTencentCloud(ctx, job, options)

	// 缓存任务信息
	s.cache.Set(ctx, cacheKey, job, 24*time.Hour)

	return &models.GenerationResponse{
		JobID:         job.ID,
		Status:        job.Status,
		Message:       "Generation job created successfully",
		EstimatedTime: s.getEstimatedTime("text"),
	}, nil
}

// GenerateFromImage 从图片生成3D模型
func (s *GenerationService) GenerateFromImage(ctx context.Context, userID, imageURL string, options *GenerationOptions) (*models.GenerationResponse, error) {
	// 计算图片哈希
	imageHash, err := s.calculateImageHash(imageURL)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate image hash: %w", err)
	}

	// 检查缓存
	cacheKey := s.cache.GenerateImageCacheKey(imageHash)
	var cachedJob models.GenerationJob
	if err := s.cache.Get(ctx, cacheKey, &cachedJob); err == nil {
		return &models.GenerationResponse{
			JobID:   cachedJob.ID,
			Status:  cachedJob.Status,
			Message: "Generated from cache",
		}, nil
	}

	// 创建新的生成任务
	job := &models.GenerationJob{
		UserID:    userID,
		ImageURL:  imageURL,
		InputType: "image",
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存到数据库
	if err := s.db.Create(job).Error; err != nil {
		return nil, fmt.Errorf("failed to create generation job: %w", err)
	}

	// 异步提交到腾讯云
	go s.submitToTencentCloud(ctx, job, options)

	// 缓存任务信息
	s.cache.Set(ctx, cacheKey, job, 24*time.Hour)

	return &models.GenerationResponse{
		JobID:         job.ID,
		Status:        job.Status,
		Message:       "Generation job created successfully",
		EstimatedTime: s.getEstimatedTime("image"),
	}, nil
}

// GenerateFromImageBase64 从Base64图片生成3D模型
func (s *GenerationService) GenerateFromImageBase64(ctx context.Context, userID, imageBase64 string, options *GenerationOptions) (*models.GenerationResponse, error) {
	// 计算图片哈希
	hash := md5.Sum([]byte(imageBase64))
	imageHash := hex.EncodeToString(hash[:])

	// 检查缓存
	cacheKey := s.cache.GenerateImageCacheKey(imageHash)
	var cachedJob models.GenerationJob
	if err := s.cache.Get(ctx, cacheKey, &cachedJob); err == nil {
		return &models.GenerationResponse{
			JobID:   cachedJob.ID,
			Status:  cachedJob.Status,
			Message: "Generated from cache",
		}, nil
	}

	// 创建新的生成任务
	job := &models.GenerationJob{
		UserID:      userID,
		ImageBase64: imageBase64,
		InputType:   "image",
		Status:      "pending",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// 保存到数据库
	if err := s.db.Create(job).Error; err != nil {
		return nil, fmt.Errorf("failed to create generation job: %w", err)
	}

	// 异步提交到腾讯云
	go s.submitToTencentCloud(ctx, job, options)

	// 缓存任务信息
	s.cache.Set(ctx, cacheKey, job, 24*time.Hour)

	return &models.GenerationResponse{
		JobID:         job.ID,
		Status:        job.Status,
		Message:       "Generation job created successfully",
		EstimatedTime: s.getEstimatedTime("image"),
	}, nil
}

// GetJobStatus 获取任务状态
func (s *GenerationService) GetJobStatus(ctx context.Context, jobID string) (*models.JobStatusResponse, error) {
	var job models.GenerationJob
	err := s.db.Where("id = ?", jobID).First(&job).Error
	if err != nil {
		return nil, fmt.Errorf("job not found: %w", err)
	}

	// 如果任务还在处理中，查询腾讯云状态
	if job.Status == "processing" && job.TencentJobID != "" {
		status, err := s.queryTencentJobStatus(ctx, job.TencentJobID, job.InputType)
		if err != nil {
			return nil, fmt.Errorf("failed to query tencent job status: %w", err)
		}

		// 更新本地状态
		job.Status = status.Status
		if status.IsCompleted() {
			job.ResultFiles = s.convertFile3Ds(status.ResultFiles)
			job.Status = "completed"
			now := time.Now()
			job.CompletedAt = &now
		} else if status.IsFailed() {
			job.Status = "failed"
			if status.ErrorMessage != nil {
				job.ErrorMsg = *status.ErrorMessage
			}
		}

		job.UpdatedAt = time.Now()
		s.db.Save(job)
	}

	// 如果状态是 "DONE"，映射为 "completed"
	if job.Status == "DONE" {
		job.Status = "completed"
		now := time.Now()
		job.CompletedAt = &now
		job.UpdatedAt = time.Now()
		s.db.Save(job)
	}

	// 计算进度
	progress := s.calculateProgress(job.Status, job.CreatedAt)

	return &models.JobStatusResponse{
		JobID:       job.ID,
		Status:      job.Status,
		Progress:    progress,
		ResultFiles: job.ResultFiles,
		ErrorMsg:    job.ErrorMsg,
		CreatedAt:   job.CreatedAt,
		UpdatedAt:   job.UpdatedAt,
	}, nil
}

// GetUserJobs 获取用户的任务列表
func (s *GenerationService) GetUserJobs(ctx context.Context, userID string, limit, offset int) ([]models.GenerationJob, error) {
	var jobs []models.GenerationJob
	err := s.db.Where("user_id = ?", userID).Find(&jobs).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user jobs: %w", err)
	}

	// 简化实现：返回所有任务（在实际应用中需要实现分页和排序）
	return jobs, nil
}

// GetStatistics 获取统计信息
func (s *GenerationService) GetStatistics(ctx context.Context, userID string) (*models.StatisticsResponse, error) {
	var stats models.StatisticsResponse

	// 简化实现：返回默认统计信息
	stats.TotalJobs = 0
	stats.CompletedJobs = 0
	stats.FailedJobs = 0
	stats.AverageScore = 0.0
	stats.APICallCount = 0
	stats.AverageTime = 0

	// 缓存命中率
	cacheStats, err := s.cache.GetCacheStats(ctx)
	if err == nil {
		stats.CacheHitRate = cacheStats.HitRate
	}

	return &stats, nil
}

// 私有方法

func (s *GenerationService) submitToTencentCloud(ctx context.Context, job *models.GenerationJob, options *GenerationOptions) {
	// 更新状态为处理中
	job.Status = "processing"
	job.UpdatedAt = time.Now()
	s.db.Save(job)

	// 创建带超时的上下文，使用更长的超时时间
	submitCtx, cancel := context.WithTimeout(context.Background(), 600*time.Second)
	defer cancel()

	var response *models.GenerationResponse
	var err error

	// 根据输入类型选择API
	switch job.InputType {
	case "text":
		response, err = s.tencentClient.SubmitTextTo3DJob(submitCtx, job.Prompt, s.convertOptions(options))
	case "image":
		// 下载图片并转换为base64
		fmt.Printf("DEBUG: Starting image download from URL: %s\n", job.ImageURL)
		imageBase64, err := s.downloadAndEncodeImage(job.ImageURL)
		if err != nil {
			fmt.Printf("DEBUG: Failed to download and encode image: %v\n", err)
			job.Status = "failed"
			job.ErrorMsg = err.Error()
			s.db.Save(job)
			return
		}
		fmt.Printf("DEBUG: Image encoded successfully, base64 length: %d\n", len(imageBase64))
		response, err = s.tencentClient.SubmitImageTo3DJob(submitCtx, imageBase64, s.convertOptions(options))
	default:
		job.Status = "failed"
		job.ErrorMsg = "unsupported input type"
		s.db.Save(job)
		return
	}

	if err != nil {
		job.Status = "failed"
		job.ErrorMsg = err.Error()
		s.db.Save(job)
		return
	}

	// 更新任务信息
	job.TencentJobID = response.JobID
	job.Status = response.Status
	s.db.Save(job)

	// 立即查询一次状态，如果是模拟环境可能会直接返回完成状态
	if job.Status == "processing" {
		queryCtx, queryCancel := context.WithTimeout(ctx, 60*time.Second)
		defer queryCancel()
		status, err := s.queryTencentJobStatus(queryCtx, job.TencentJobID, job.InputType)
		if err == nil {
			// 更新本地状态
			job.Status = status.Status
			if status.IsCompleted() {
				job.ResultFiles = s.convertFile3Ds(status.ResultFiles)
				job.Status = "completed"
				now := time.Now()
				job.CompletedAt = &now
			} else if status.IsFailed() {
				job.Status = "failed"
				if status.ErrorMessage != nil {
					job.ErrorMsg = *status.ErrorMessage
				}
			}
			job.UpdatedAt = time.Now()
			s.db.Save(job)
		}
	}
}

func (s *GenerationService) queryTencentJobStatus(ctx context.Context, tencentJobID, inputType string) (*tencentcloud.JobStatus, error) {
	// 根据输入类型选择查询API
	var jobType tencentcloud.JobType
	switch inputType {
	case "text", "image":
		jobType = tencentcloud.JobTypeStandard
	default:
		jobType = tencentcloud.JobTypeStandard
	}

	return s.tencentClient.QueryJobStatus(ctx, tencentJobID, jobType)
}

func (s *GenerationService) calculateImageHash(imageURL string) (string, error) {
	// 下载图片
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 读取图片数据
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// 计算MD5哈希
	hash := md5.Sum(data)
	return hex.EncodeToString(hash[:]), nil
}

func (s *GenerationService) downloadAndEncodeImage(imageURL string) (string, error) {
	// 下载图片
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 读取图片数据
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// 转换为base64
	base64Data := base64.StdEncoding.EncodeToString(data)
	return base64Data, nil
}

func (s *GenerationService) convertOptions(options *GenerationOptions) *tencentcloud.GenerationOptions {
	if options == nil {
		return nil
	}

	// 将ResultFormat转换为大写，因为腾讯云API要求大写格式
	resultFormat := strings.ToUpper(options.ResultFormat)
	if resultFormat == "" {
		resultFormat = "OBJ" // 默认格式
	}

	return &tencentcloud.GenerationOptions{
		ResultFormat: resultFormat,
		EnablePBR:    options.EnablePBR,
	}
}

func (s *GenerationService) convertFile3Ds(files []tencentcloud.File3D) []models.File3D {
	result := make([]models.File3D, len(files))
	for i, file := range files {
		// 将文件类型转换为小写，以便与下载接口兼容
		fileType := strings.ToLower(file.Type)
		if fileType == "" {
			fileType = "obj" // 默认类型
		}

		result[i] = models.File3D{
			Type:            fileType,
			URL:             file.URL,
			PreviewImageURL: file.PreviewImageURL,
		}
	}
	return result
}

func (s *GenerationService) calculateProgress(status string, createdAt time.Time) int {
	switch status {
	case "pending", "waiting":
		return 10
	case "processing":
		// 根据时间计算进度，但不要硬编码90%
		elapsed := time.Since(createdAt)
		minutes := int(elapsed.Minutes())

		// 更平滑的进度计算
		if minutes < 1 {
			return 20
		} else if minutes < 2 {
			return 40
		} else if minutes < 3 {
			return 60
		} else if minutes < 4 {
			return 80
		} else if minutes < 5 {
			return 90
		} else if minutes < 10 {
			return 95 // 超过5分钟但不到10分钟，显示95%
		} else {
			return 98 // 超过10分钟，显示98%，表示即将完成
		}
	case "completed":
		return 100
	case "failed":
		return 0
	default:
		return 0
	}
}

func (s *GenerationService) getEstimatedTime(inputType string) int {
	switch inputType {
	case "text":
		return 300 // 5分钟
	case "image":
		return 240 // 4分钟
	default:
		return 300
	}
}

// 类型定义
type GenerationOptions struct {
	ResultFormat string `json:"result_format,omitempty"`
	EnablePBR    bool   `json:"enable_pbr,omitempty"`
	FaceCount    int64  `json:"face_count,omitempty"`
	GenerateType string `json:"generate_type,omitempty"`
}
