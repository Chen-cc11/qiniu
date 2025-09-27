package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// GenerationJob 3D模型生成任务
type GenerationJob struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	UserID       string     `json:"user_id" gorm:"index"`
	Prompt       string     `json:"prompt,omitempty"`
	ImageURL     string     `json:"image_url,omitempty"`
	ImageBase64  string     `json:"image_base64,omitempty"`
	InputType    string     `json:"input_type"` // "text", "image", "multiview"
	Status       string     `json:"status"`     // "pending", "processing", "completed", "failed"
	TencentJobID string     `json:"tencent_job_id,omitempty"`
	ResultFiles  []File3D   `json:"result_files,omitempty" gorm:"serializer:json"`
	ErrorMsg     string     `json:"error_msg,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

// File3D 3D文件信息
type File3D struct {
	Type            string `json:"type"`
	URL             string `json:"url"`
	PreviewImageURL string `json:"preview_image_url"`
}

// User 用户信息
type User struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	Email        string     `json:"email" gorm:"uniqueIndex"`
	Name         string     `json:"name"`
	PasswordHash string     `json:"-" gorm:"column:password_hash"` // 不返回给客户端
	IsActive     bool       `json:"is_active" gorm:"default:true"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// Evaluation 评估记录
type Evaluation struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	JobID         string    `json:"job_id" gorm:"index"`
	UserID        string    `json:"user_id" gorm:"index"`
	QualityScore  int       `json:"quality_score"`  // 1-5分
	AccuracyScore int       `json:"accuracy_score"` // 1-5分
	SpeedScore    int       `json:"speed_score"`    // 1-5分
	OverallScore  float64   `json:"overall_score"`  // 综合评分
	Feedback      string    `json:"feedback,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// CacheEntry 缓存条目
type CacheEntry struct {
	Key         string    `json:"key" gorm:"primaryKey"`
	Value       string    `json:"value" gorm:"type:text"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
	AccessCount int       `json:"access_count"`
}

// APIUsage API使用统计
type APIUsage struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	UserID       string    `json:"user_id" gorm:"index"`
	APIType      string    `json:"api_type"` // "standard", "pro", "rapid"
	RequestCount int       `json:"request_count"`
	SuccessCount int       `json:"success_count"`
	FailedCount  int       `json:"failed_count"`
	TotalCost    float64   `json:"total_cost"`
	Date         time.Time `json:"date" gorm:"index"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// GenerationRequest 生成请求
type GenerationRequest struct {
	Prompt          string      `json:"prompt,omitempty"`
	ImageURL        string      `json:"image_url,omitempty"`
	ImageBase64     string      `json:"image_base64,omitempty"`
	InputType       string      `json:"input_type"`
	MultiViewImages []ViewImage `json:"multi_view_images,omitempty"`
	ResultFormat    string      `json:"result_format,omitempty"`
	EnablePBR       bool        `json:"enable_pbr,omitempty"`
	FaceCount       int64       `json:"face_count,omitempty"`
	GenerateType    string      `json:"generate_type,omitempty"`
}

// ViewImage 多视角图片
type ViewImage struct {
	ViewType     string `json:"view_type"`
	ViewImageURL string `json:"view_image_url"`
}

// GenerationResponse 生成响应
type GenerationResponse struct {
	JobID         string `json:"job_id"`
	Status        string `json:"status"`
	Message       string `json:"message,omitempty"`
	EstimatedTime int    `json:"estimated_time,omitempty"` // 预计完成时间(秒)
}

// JobStatusResponse 任务状态响应
type JobStatusResponse struct {
	JobID       string    `json:"job_id"`
	Status      string    `json:"status"`
	Progress    int       `json:"progress"` // 0-100
	ResultFiles []File3D  `json:"result_files,omitempty"`
	ErrorMsg    string    `json:"error_msg,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// EvaluationRequest 评估请求
type EvaluationRequest struct {
	JobID         string `json:"job_id"`
	QualityScore  int    `json:"quality_score"`
	AccuracyScore int    `json:"accuracy_score"`
	SpeedScore    int    `json:"speed_score"`
	Feedback      string `json:"feedback,omitempty"`
}

// EvaluationResponse 评估响应
type EvaluationResponse struct {
	EvaluationID string  `json:"evaluation_id"`
	OverallScore float64 `json:"overall_score"`
	Message      string  `json:"message"`
}

// StatisticsResponse 统计响应
type StatisticsResponse struct {
	TotalJobs     int     `json:"total_jobs"`
	CompletedJobs int     `json:"completed_jobs"`
	FailedJobs    int     `json:"failed_jobs"`
	AverageScore  float64 `json:"average_score"`
	APICallCount  int     `json:"api_call_count"`
	CacheHitRate  float64 `json:"cache_hit_rate"`
	AverageTime   int     `json:"average_time"` // 平均生成时间(秒)
}

// AuthRequest 认证请求
type AuthRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name,omitempty"` // 注册时使用
}

// AuthResponse 认证响应
type AuthResponse struct {
	Token     string    `json:"token"`
	User      User      `json:"user"`
	ExpiresAt time.Time `json:"expires_at"`
	Message   string    `json:"message,omitempty"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}

// BeforeCreate GORM钩子
func (j *GenerationJob) BeforeCreate(tx *gorm.DB) error {
	if j.ID == "" {
		j.ID = generateID()
	}
	return nil
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = generateID()
	}
	return nil
}

func (e *Evaluation) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = generateID()
	}
	// 计算综合评分
	e.OverallScore = float64(e.QualityScore+e.AccuracyScore+e.SpeedScore) / 3.0
	return nil
}

func (a *APIUsage) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = generateID()
	}
	return nil
}

func generateID() string {
	// 使用纳秒时间戳 + 随机字符串确保唯一性
	return fmt.Sprintf("%d-%s", time.Now().UnixNano(), randomString(12))
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
