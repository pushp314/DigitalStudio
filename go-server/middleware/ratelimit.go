package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	requests int
	resetAt  time.Time
}

type memoryRateLimiter struct {
	mu      sync.Mutex
	entries map[string]*rateLimitEntry
}

func newMemoryRateLimiter() *memoryRateLimiter {
	return &memoryRateLimiter{
		entries: make(map[string]*rateLimitEntry),
	}
}

var globalRateLimiter = newMemoryRateLimiter()

func RateLimitMiddleware(bucket string, maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if maxRequests <= 0 {
			c.Next()
			return
		}

		key := fmt.Sprintf("%s:%s", bucket, c.ClientIP())
		now := time.Now()

		globalRateLimiter.mu.Lock()
		entry, ok := globalRateLimiter.entries[key]
		if !ok || now.After(entry.resetAt) {
			entry = &rateLimitEntry{
				requests: 0,
				resetAt:  now.Add(window),
			}
			globalRateLimiter.entries[key] = entry
		}

		if entry.requests >= maxRequests {
			retryAfter := int(time.Until(entry.resetAt).Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			globalRateLimiter.mu.Unlock()

			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		entry.requests++
		globalRateLimiter.mu.Unlock()
		c.Next()
	}
}
