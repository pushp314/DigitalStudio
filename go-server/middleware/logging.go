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

		latency := time.Since(start)
		status := c.Writer.Status()

		args := []any{
			slog.Any("request_id", requestID),
			slog.String("method", c.Request.Method),
			slog.String("path", c.FullPath()),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("ip", c.ClientIP()),
			slog.Any("user_id", userID),
		}

		if len(c.Errors) > 0 {
			args = append(args, slog.String("error", c.Errors.ByType(gin.ErrorTypePrivate).String()))
		}

		if status >= 500 {
			logger.Error("server_error", args...)
		} else if status >= 400 {
			logger.Warn("client_error", args...)
		} else {
			logger.Info("request_success", args...)
		}
	}
}
