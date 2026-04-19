package middleware

import (
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func MaintenanceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow specific paths to bypass maintenance
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/admin") || 
		   strings.HasPrefix(path, "/api/auth") ||
		   strings.HasPrefix(path, "/api/config") ||
		   strings.HasPrefix(path, "/api/orders") ||
		   strings.HasPrefix(path, "/api/licenses") ||
		   strings.HasPrefix(path, "/api/analytics") ||
		   strings.HasPrefix(path, "/api/intelligence") ||
		   strings.HasPrefix(path, "/api/docs") ||
		   strings.HasPrefix(path, "/api/testimonials") ||
		   path == "/api/upload" ||
		   path == "/healthz" ||
		   path == "/readyz" {
			c.Next()
			return
		}

		// Fetch Site Config
		var siteConfig models.SiteConfig
		if err := config.DB.First(&siteConfig).Error; err == nil {
			if siteConfig.MaintenanceMode {
				c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
					"maintenance": true,
					"message":     siteConfig.MaintenanceMessage,
				})
				return
			}
		}

		c.Next()
	}
}
