package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// aiUsageEntry tracks per-user daily AI usage
type aiUsageEntry struct {
	count   int
	resetAt time.Time
}

type aiUsageLimiter struct {
	mu      sync.Mutex
	entries map[uint]*aiUsageEntry
}

var globalAIUsageLimiter = &aiUsageLimiter{
	entries: make(map[uint]*aiUsageEntry),
}

// AIUsageLimitMiddleware enforces per-user daily AI request limits.
// Free users get `freeLimit` per day, Pro users get unlimited.
func AIUsageLimitMiddleware(freeLimit int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Pro users and admins bypass limits
		isPro, _ := c.Get("isPro")
		role, _ := c.Get("userRole")

		if isPro == true || role == "admin" {
			c.Next()
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		uid, ok := userID.(uint)
		if !ok {
			c.Next()
			return
		}

		now := time.Now()
		globalAIUsageLimiter.mu.Lock()

		entry, ok := globalAIUsageLimiter.entries[uid]
		if !ok || now.After(entry.resetAt) {
			// Reset at midnight
			tomorrow := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
			entry = &aiUsageEntry{
				count:   0,
				resetAt: tomorrow,
			}
			globalAIUsageLimiter.entries[uid] = entry
		}

		if entry.count >= freeLimit {
			remaining := int(time.Until(entry.resetAt).Hours())
			globalAIUsageLimiter.mu.Unlock()

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":     fmt.Sprintf("Daily AI limit reached (%d/%d). Upgrade to Pro for unlimited access.", freeLimit, freeLimit),
				"upgrade":   true,
				"resetIn":   fmt.Sprintf("%dh", remaining),
			})
			c.Abort()
			return
		}

		entry.count++
		globalAIUsageLimiter.mu.Unlock()

		// Set usage headers for frontend
		c.Header("X-AI-Usage", fmt.Sprintf("%d/%d", entry.count, freeLimit))
		c.Next()
	}
}
