package repository

import (
	"github.com/Chen-cc11/qiniu/backend/internal/models"
	"gorm.io/gorm"
)

// TaskRepository 任务仓储接口
type TaskRepository interface {
	Create(task *models.Task) error
	GetByID(taskID string) (*models.Task, error)
	GetByUserID(userID string, limit, offset int) ([]*models.Task, error)
	UpdateStatus(taskID, status string) error
	UpdateTripoTaskID(taskID, tripoTaskID string) error
	UpdateResult(taskID, resultURL, thumbnailURL string) error
	UpdateError(taskID, errorMessage string) error
	GetPendingTasks(limit int) ([]*models.Task, error)
	Delete(taskID string) error
}

// taskRepository 任务仓储实现
type taskRepository struct {
	db *gorm.DB
}

// NewTaskRepository
//
// @Description: 创建新的任务存储
func NewTaskRepository(db *gorm.DB) TaskRepository {
	return &taskRepository{
		db: db,
	}
}

// Create
//
// @Description: 创建任务
func (r *taskRepository) Create(task *models.Task) error {
	return r.db.Create(task).Error
}

// GetByID
//
// @Description: 根据ID获取任务
func (r *taskRepository) GetByID(taskID string) (*models.Task, error) {
	var task models.Task
	err := r.db.Preload("User").First(&task, "id = ?", taskID).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

// GetByUserID
//
// @Description: 根据用户ID获取任务列表
func (r *taskRepository) GetByUserID(userID string, limit, offset int) ([]*models.Task, error) {
	var tasks []*models.Task
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(limit).Offset(offset).Find(&tasks).Error
	return tasks, err
}

// UpdateStatus
//
// @Description: 更新任务状态
func (r *taskRepository) UpdateStatus(taskID, status string) error {
	return r.db.Model(&models.Task{}).
		Where("id = ?", taskID).
		Update("status", status).Error
}

// UpdateTripoTaskID
//
// @Description: 更新Tripo3D任务状态
func (r *taskRepository) UpdateTripoTaskID(taskID, tripoTaskID string) error {
	return r.db.Model(&models.Task{}).
		Where("id = ?", taskID).
		Update("tripo_task_id", tripoTaskID).Error
}

// UpdateResult
//
// @Description: 更新任务结果
func (r *taskRepository) UpdateResult(taskID, resultURL, thumbnailURL string) error {
	return r.db.Model(&models.Task{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"result_url":    resultURL,
		"thumbnail_url": thumbnailURL,
	}).Error
}

// UpdateError
//
// @Description: 更新任务错误信息
func (r *taskRepository) UpdateError(taskID, errorMessage string) error {
	return r.db.Model(&models.Task{}).
		Where("id = ?", taskID).
		Update("error_message", errorMessage).Error
}

// GetPendingTasks
//
// @Description: 获取待处理的任务
func (r *taskRepository) GetPendingTasks(limit int) ([]*models.Task, error) {
	var tasks []*models.Task
	err := r.db.Where("status = ?", "pending").
		Order("created_at desc").Limit(limit).Find(&tasks).Error
	return tasks, err
}

// Delete
//
// @Description: 删除任务
func (r *taskRepository) Delete(taskID string) error {
	return r.db.Delete(&models.Task{}, "id = ?", taskID).Error
}
