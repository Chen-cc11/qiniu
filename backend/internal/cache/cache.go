package cache

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type CacheService struct {
	redis *redis.Client
	db    *gorm.DB
}

type CacheEntry struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
	AccessCount int       `json:"access_count"`
}

func NewCacheService(redis *redis.Client, db *gorm.DB) *CacheService {
	return &CacheService{
		redis: redis,
		db:    db,
	}
}

// Set 设置缓存
func (c *CacheService) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	// 序列化值
	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	// 如果Redis可用，设置Redis缓存
	if c.redis != nil {
		err = c.redis.Set(ctx, key, jsonData, expiration).Err()
		if err != nil {
			return fmt.Errorf("failed to set redis cache: %w", err)
		}
	}

	// 记录到数据库
	entry := CacheEntry{
		Key:         key,
		Value:       string(jsonData),
		ExpiresAt:   time.Now().Add(expiration),
		CreatedAt:   time.Now(),
		AccessCount: 0,
	}

	// 使用GORM的Save方法，如果存在则更新，不存在则创建
	c.db.Save(&entry)

	return nil
}

// Get 获取缓存
func (c *CacheService) Get(ctx context.Context, key string, dest interface{}) error {
	// 如果Redis可用，先从Redis获取
	if c.redis != nil {
		val, err := c.redis.Get(ctx, key).Result()
		if err == nil {
			// 更新访问计数
			c.updateAccessCount(key)
			return json.Unmarshal([]byte(val), dest)
		}
	}

	// Redis不可用或没有找到，从数据库获取
	var entry CacheEntry
	err := c.db.Where("key = ? AND expires_at > ?", key, time.Now()).First(&entry).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("cache not found")
		}
		return fmt.Errorf("failed to get from database: %w", err)
	}

	// 更新访问计数
	c.updateAccessCount(key)

	// 如果Redis可用，将数据重新放入Redis
	if c.redis != nil {
		c.redis.Set(ctx, key, entry.Value, time.Until(entry.ExpiresAt))
	}

	return json.Unmarshal([]byte(entry.Value), dest)
}

// Delete 删除缓存
func (c *CacheService) Delete(ctx context.Context, key string) error {
	// 如果Redis可用，删除Redis缓存
	if c.redis != nil {
		err := c.redis.Del(ctx, key).Err()
		if err != nil {
			return fmt.Errorf("failed to delete from redis: %w", err)
		}
	}

	// 删除数据库记录
	c.db.Where("key = ?", key).Delete(&CacheEntry{})

	return nil
}

// Exists 检查缓存是否存在
func (c *CacheService) Exists(ctx context.Context, key string) bool {
	// 如果Redis可用，先检查Redis
	if c.redis != nil {
		exists, err := c.redis.Exists(ctx, key).Result()
		if err == nil && exists > 0 {
			return true
		}
	}

	// 检查数据库
	var count int64
	c.db.Model(&CacheEntry{}).Where("key = ? AND expires_at > ?", key, time.Now()).Count(&count)
	return count > 0
}

// GenerateCacheKey 生成缓存键
func (c *CacheService) GenerateCacheKey(prefix string, data interface{}) string {
	jsonData, _ := json.Marshal(data)
	hash := md5.Sum(jsonData)
	return fmt.Sprintf("%s:%x", prefix, hash)
}

// GeneratePromptCacheKey 为提示词生成缓存键
func (c *CacheService) GeneratePromptCacheKey(prompt string) string {
	return c.GenerateCacheKey("prompt", map[string]string{"text": prompt})
}

// GenerateImageCacheKey 为图片生成缓存键
func (c *CacheService) GenerateImageCacheKey(imageHash string) string {
	return c.GenerateCacheKey("image", map[string]string{"hash": imageHash})
}

// GetCacheStats 获取缓存统计
func (c *CacheService) GetCacheStats(ctx context.Context) (*CacheStats, error) {
	var info string
	var err error

	// 如果Redis可用，获取Redis统计
	if c.redis != nil {
		info, err = c.redis.Info(ctx, "memory").Result()
		if err != nil {
			info = "Redis unavailable"
		}
	} else {
		info = "Redis not available"
	}

	// 数据库统计
	var totalEntries int64
	var expiredEntries int64
	var totalAccess int64

	c.db.Model(&CacheEntry{}).Count(&totalEntries)
	c.db.Model(&CacheEntry{}).Where("expires_at <= ?", time.Now()).Count(&expiredEntries)
	c.db.Model(&CacheEntry{}).Select("SUM(access_count)").Scan(&totalAccess)

	// 计算命中率
	var hitRate float64
	if totalAccess > 0 {
		hitRate = float64(totalAccess) / float64(totalAccess+expiredEntries) * 100
	}

	return &CacheStats{
		TotalEntries:   totalEntries,
		ExpiredEntries: expiredEntries,
		HitRate:        hitRate,
		RedisInfo:      info,
	}, nil
}

// CleanupExpired 清理过期缓存
func (c *CacheService) CleanupExpired(ctx context.Context) error {
	// 删除过期的数据库记录
	result := c.db.Where("expires_at <= ?", time.Now()).Delete(&CacheEntry{})
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup expired entries: %w", result.Error)
	}

	// 如果Redis可用，清理Redis中的过期键（Redis会自动清理，但我们可以手动触发）
	if c.redis != nil {
		c.redis.FlushDB(ctx)
	}

	return nil
}

// updateAccessCount 更新访问计数
func (c *CacheService) updateAccessCount(key string) {
	c.db.Model(&CacheEntry{}).Where("key = ?", key).Update("access_count", gorm.Expr("access_count + 1"))
}

type CacheStats struct {
	TotalEntries   int64   `json:"total_entries"`
	ExpiredEntries int64   `json:"expired_entries"`
	HitRate        float64 `json:"hit_rate"`
	RedisInfo      string  `json:"redis_info"`
}

// CacheKey 缓存键常量
const (
	PromptCachePrefix = "prompt"
	ImageCachePrefix  = "image"
	JobCachePrefix    = "job"
	UserCachePrefix   = "user"
)
