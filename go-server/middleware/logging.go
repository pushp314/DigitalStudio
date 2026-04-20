package middleware

import (
	"log/slog"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func RequestLogger() gin.HandlerFunc {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		requestID, _ := c.Get(RequestIDKey)
		userID, _ := c.Get("userID")

		logger.Info("http_request",
			slog.Any("request_id", requestID),
			slog.String("method", c.Request.Method),
			slog.String("path", c.FullPath()),
			slog.String("rawPath", c.Request.URL.Path),
			slog.Int("status", c.Writer.Status()),
			slog.Duration("latency", time.Since(start)),
			slog.String("clientIP", c.ClientIP()),
			slog.String("userAgent", c.Request.UserAgent()),
			slog.Any("user_id", userID),
		)
	}
}
