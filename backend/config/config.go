package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Tencent  TencentConfig
	Redis    RedisConfig
	Database DatabaseConfig
	Cache    CacheConfig
	Auth     AuthConfig
}

type ServerConfig struct {
	Port         string
	Host         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

type TencentConfig struct {
	SecretId  string
	SecretKey string
	Region    string
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

type DatabaseConfig struct {
	DSN string
}

type CacheConfig struct {
	DefaultExpiration time.Duration
	CleanupInterval   time.Duration
}

type AuthConfig struct {
	JWTSecret    string
	TokenExpiry  time.Duration
}

func Load() (*Config, error) {
	// 加载.env文件
	if err := godotenv.Load(); err != nil {
		// 如果.env文件不存在，继续使用环境变量
	}

	config := &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			ReadTimeout:  getDurationEnv("SERVER_READ_TIMEOUT", 30*time.Second),
			WriteTimeout: getDurationEnv("SERVER_WRITE_TIMEOUT", 30*time.Second),
		},
		Tencent: TencentConfig{
			SecretId:  getEnv("TENCENT_SECRET_ID", ""),
			SecretKey: getEnv("TENCENT_SECRET_KEY", ""),
			Region:    getEnv("TENCENT_REGION", "ap-beijing"),
		},
		Redis: RedisConfig{
			Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getIntEnv("REDIS_DB", 0),
		},
		Database: DatabaseConfig{
			DSN: getEnv("DATABASE_DSN", "3d_models.db"),
		},
		Cache: CacheConfig{
			DefaultExpiration: getDurationEnv("CACHE_DEFAULT_EXPIRATION", 24*time.Hour),
			CleanupInterval:   getDurationEnv("CACHE_CLEANUP_INTERVAL", 1*time.Hour),
		},
		Auth: AuthConfig{
			JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
			TokenExpiry: getDurationEnv("TOKEN_EXPIRY", 24*time.Hour),
		},
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
