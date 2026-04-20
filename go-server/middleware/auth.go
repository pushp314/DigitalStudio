package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/utils"
)

type authOptions struct {
	allowQueryToken bool
}

func AuthMiddleware() gin.HandlerFunc {
	return authMiddleware(authOptions{})
}

func WebsocketAuthMiddleware() gin.HandlerFunc {
	return authMiddleware(authOptions{allowQueryToken: true})
}

func authMiddleware(options authOptions) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractBearerToken(c.GetHeader("Authorization"))
		if tokenString == "" && options.allowQueryToken {
			tokenString = strings.TrimSpace(c.Query("token"))
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			c.Abort()
			return
		}
		claims, err := utils.ParseJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		var user models.User
		if err := config.DB.First(&user, claims.UserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}
		if user.Suspended {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account suspended"})
			c.Abort()
			return
		}

		user = utils.NormalizeUserAccess(user)

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

func extractBearerToken(authHeader string) string {
	authHeader = strings.TrimSpace(authHeader)
	if authHeader == "" {
		return ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
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
