package database

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"3d-model-generator-backend/internal/models"
)

// JSONDatabase 是一个基于JSON文件的简单数据库实现
type JSONDatabase struct {
	filePath string
	mutex    sync.RWMutex
	data     *DatabaseData
}

// DatabaseData 存储所有数据
type DatabaseData struct {
	GenerationJobs []models.GenerationJob `json:"generation_jobs"`
	Users          []models.User          `json:"users"`
	Evaluations    []models.Evaluation    `json:"evaluations"`
	CacheEntries   []models.CacheEntry    `json:"cache_entries"`
	APIUsages      []models.APIUsage      `json:"api_usages"`
}

// NewJSONDatabase 创建新的JSON数据库实例
func NewJSONDatabase(filePath string) *JSONDatabase {
	db := &JSONDatabase{
		filePath: filePath,
		data: &DatabaseData{
			GenerationJobs: make([]models.GenerationJob, 0),
			Users:          make([]models.User, 0),
			Evaluations:    make([]models.Evaluation, 0),
			CacheEntries:   make([]models.CacheEntry, 0),
			APIUsages:      make([]models.APIUsage, 0),
		},
	}
	
	// 尝试加载现有数据
	db.loadData()
	return db
}

// loadData 从文件加载数据
func (db *JSONDatabase) loadData() error {
	db.mutex.Lock()
	defer db.mutex.Unlock()
	
	file, err := os.Open(db.filePath)
	if err != nil {
		// 文件不存在，使用空数据
		return nil
	}
	defer file.Close()
	
	decoder := json.NewDecoder(file)
	return decoder.Decode(db.data)
}

// saveData 保存数据到文件
func (db *JSONDatabase) saveData() error {
	db.mutex.Lock()
	defer db.mutex.Unlock()
	
	file, err := os.Create(db.filePath)
	if err != nil {
		return err
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(db.data)
}

// Create 创建新记录
func (db *JSONDatabase) Create(value interface{}) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()
	
	switch v := value.(type) {
	case *models.GenerationJob:
		v.ID = fmt.Sprintf("%d", len(db.data.GenerationJobs)+1)
		v.CreatedAt = time.Now()
		v.UpdatedAt = time.Now()
		db.data.GenerationJobs = append(db.data.GenerationJobs, *v)
	case *models.User:
		v.ID = fmt.Sprintf("%d", len(db.data.Users)+1)
		v.CreatedAt = time.Now()
		v.UpdatedAt = time.Now()
		db.data.Users = append(db.data.Users, *v)
	case *models.Evaluation:
		v.ID = fmt.Sprintf("%d", len(db.data.Evaluations)+1)
		v.CreatedAt = time.Now()
		db.data.Evaluations = append(db.data.Evaluations, *v)
	case *models.CacheEntry:
		v.Key = fmt.Sprintf("cache_%d", len(db.data.CacheEntries)+1)
		v.CreatedAt = time.Now()
		db.data.CacheEntries = append(db.data.CacheEntries, *v)
	case *models.APIUsage:
		v.ID = fmt.Sprintf("%d", len(db.data.APIUsages)+1)
		v.CreatedAt = time.Now()
		v.UpdatedAt = time.Now()
		db.data.APIUsages = append(db.data.APIUsages, *v)
	default:
		return fmt.Errorf("unsupported type: %T", value)
	}
	
	return db.saveData()
}

// First 查找第一条记录
func (db *JSONDatabase) First(dest interface{}, conds ...interface{}) error {
	db.mutex.RLock()
	defer db.mutex.RUnlock()
	
	// 这里实现简单的查找逻辑
	// 在实际应用中，您可能需要更复杂的查询逻辑
	return fmt.Errorf("First method not implemented for JSON database")
}

// Find 查找记录
func (db *JSONDatabase) Find(dest interface{}, conds ...interface{}) error {
	db.mutex.RLock()
	defer db.mutex.RUnlock()
	
	// 这里实现简单的查找逻辑
	// 在实际应用中，您可能需要更复杂的查询逻辑
	return fmt.Errorf("Find method not implemented for JSON database")
}

// Save 保存记录
func (db *JSONDatabase) Save(value interface{}) error {
	return db.Create(value)
}

// Delete 删除记录
func (db *JSONDatabase) Delete(value interface{}) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()
	
	// 这里实现简单的删除逻辑
	// 在实际应用中，您可能需要更复杂的删除逻辑
	return fmt.Errorf("Delete method not implemented for JSON database")
}

// AutoMigrate 自动迁移（对于JSON数据库，这是一个空操作）
func (db *JSONDatabase) AutoMigrate(dst ...interface{}) error {
	return nil
}

// Close 关闭数据库连接
func (db *JSONDatabase) Close() error {
	return db.saveData()
}
