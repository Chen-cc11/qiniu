package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Chen-cc11/qiniu/backend/internal/models"
	"github.com/go-redis/redis/v8"
)

// CacheManager 缓存管理器
type CacheManager struct {
	redis *redis.Client
}

// NewCacheManager 创建新的缓存管理器
func NewCacheManager(redisClient *redis.Client) *CacheManager {
	return &CacheManager{
		redis: redisClient,
	}
}

// GetTask
//
// @Description: 获取缓存的任务
func (c *CacheManager) GetTask(inputHash string) *models.Task {
	ctx := context.Background()
	key := fmt.Sprintf("task:%s", inputHash)

	data, err := c.redis.Get(ctx, key).Result()
	if err != nil {
		return nil
	}

	var task models.Task
	if err := json.Unmarshal([]byte(data), &task); err != nil {
		return nil
	}
	return &task
}

// SetTask
//
// @Description:设置缓存的任务
func (c *CacheManager) SetTask(inputHash string, task *models.Task) {
	ctx := context.Background()
	key := fmt.Sprintf("task:%s", inputHash)

	data, err := json.Marshal(task)
	if err != nil {
		return
	}
	// 缓存24小时
	if err := c.redis.Set(ctx, key, data, 24*time.Hour).Err(); err != nil {
		return
	}
}

// DeleteTask
//
// @Description: 删除缓存的任务
func (c *CacheManager) DeleteTask(inputHash string) {
	ctx := context.Background()
	key := fmt.Sprintf("task:%s", inputHash)
	c.redis.Del(ctx, key).Err()
}

// GetUserTasks
//
// @Description: 获取用户任务缓存
func (c *CacheManager) GetUserTasks(userID string, limit, offset int) []*models.Task {
	ctx := context.Background()
	key := fmt.Sprintf("user_tasks:%s:%d:%d", userID, limit, offset)

	data, err := c.redis.Get(ctx, key).Result()
	if err != nil {
		return nil
	}
	var tasks []*models.Task
	if err := json.Unmarshal([]byte(data), &tasks); err != nil {
		return nil
	}
	return tasks
}

// SetUserTasks
//
// @Description: 设置用户缓存
func (c *CacheManager) SetUserTasks(userID string, limit, offset int, tasks []*models.Task) {
	ctx := context.Background()
	key := fmt.Sprintf("user_tasks:%s:%d:%d", userID, limit, offset)

	data, err := json.Marshal(tasks)
	if err != nil {
		return
	}

	// 缓存1小时
	c.redis.Set(ctx, key, data, time.Hour)
}

// DeleteUserTaskCache
//
// @Description: 删除用户任务缓存
func (c *CacheManager) DeleteUserTaskCache(userID string) {
	ctx := context.Background()
	pattern := fmt.Sprintf("user_tasks:%s", userID)

	keys, err := c.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return
	}
	if len(keys) > 0 {
		c.redis.Del(ctx, keys...)
	}
}

// GetBalance
//
// @Description: 获取余额缓存
func (c *CacheManager) GetBalance() *models.TripoBalanceResponse {
	ctx := context.Background()
	key := "balance"

	data, err := c.redis.Get(ctx, key).Result()
	if err != nil {
		return nil
	}

	var balance models.TripoBalanceResponse
	if err := json.Unmarshal([]byte(data), &balance); err != nil {
		return nil
	}
	return &balance
}

// SetBalance
//
// @Description: 设置余额缓存
func (c *CacheManager) SetBalance(balance *models.TripoBalanceResponse) {
	ctx := context.Background()
	key := "balance"
	data, err := json.Marshal(balance)
	if err != nil {
		return
	}
	// 缓存5分钟
	c.redis.Set(ctx, key, data, 5*time.Minute)
}

// ClearAll
//
// @Description: 清空所有缓存
func (c *CacheManager) ClearAll() {
	ctx := context.Background()
	c.redis.FlushDB(ctx)
}
