package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	requests int
	resetAt  time.Time
}

func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	var entries sync.Map

	return func(c *gin.Context) {
		if maxRequests <= 0 {
			c.Next()
			return
		}

		key := c.ClientIP()
		now := time.Now()
		value, _ := entries.LoadOrStore(key, &rateLimitEntry{
			requests: 0,
			resetAt:  now.Add(window),
		})

		entry := value.(*rateLimitEntry)
		if now.After(entry.resetAt) {
			entry.requests = 0
			entry.resetAt = now.Add(window)
		}

		if entry.requests >= maxRequests {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		entry.requests++
		c.Next()
	}
}
