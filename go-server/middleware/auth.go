package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback to query parameter (crucial for WebSockets)
		if tokenString == "" {
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			c.Abort()
			return
		}
		secret := os.Getenv("JWT_SECRET")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
			c.Abort()
			return
		}

			var user models.User
			if err := config.DB.First(&user, uint(userIDFloat)).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				c.Abort()
				return
			}
			if user.Suspended {
				c.JSON(http.StatusForbidden, gin.H{"error": "Account suspended"})
				c.Abort()
				return
			}

			// Self-Healing Subscription Logic
			if user.IsPro && user.ProExpiresAt != nil {
				if time.Now().After(*user.ProExpiresAt) {
					user.IsPro = false
					user.SubscriptionPlan = "free"
					config.DB.Save(&user)
					// Log for system audit
					fmt.Printf("Subscription expired and revoked for user ID: %d\n", user.ID)
				}
			}

			c.Set("user", user)
			c.Set("userID", user.ID)
			c.Set("userRole", user.Role)
			c.Set("userPlan", user.SubscriptionPlan)
			c.Set("isPro", user.IsPro)

			c.Next()
	}
}

func ProMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("userRole")
		isPro, _ := c.Get("isPro")
		
		if role == models.RoleAdmin {
			c.Next()
			return
		}

		if isPro != true {
			c.JSON(http.StatusForbidden, gin.H{"error": "Active Pro subscription required to access this protocol"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists || role != models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
