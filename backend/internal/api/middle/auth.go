package middle

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

// AuthMiddleware 认证中间件
type AuthMiddleware struct {
	secretKey string
}

// NewAuthMiddleware 创建一个新的认证中间件实例
func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{
		secretKey: "tsk_Y5Qx_Bkv4jrYJ3BcHBIQS7Qo0UPXFf1FhaeWGHtKwEu",
	}
}

// RequireAuth
//
// @Description: 需要认证的中间件
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("[BACKEND DEBUG] --- New Request Received by Middleware ---")
		
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			return
		}
		
		// --- 终极诊断日志 (后端) ---
		log.Printf("[BACKEND DEBUG] Token received by backend: %s", tokenString)
		log.Printf("[BACKEND DEBUG] Secret key used by backend: %s", m.secretKey)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.secretKey), nil
		})
		
		if err != nil || !token.Valid {
			log.Printf("[BACKEND DEBUG] Token validation FAILED! Error: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		
		log.Println("[BACKEND DEBUG] Token validation SUCCESSFUL!")

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		userID, ok := claims["userID"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

// OptionalAuth ... (保持不变)
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			c.Next()
			return
		}
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.secretKey), nil
		})
		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if userID, ok := claims["userID"].(string); ok {
					c.Set("userID", userID)
				}
			}
		}
		c.Next()
	}
}