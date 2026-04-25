package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/services"
)

func Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func Readyz(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	checks := gin.H{
		"database": "ok",
		"r2":       "ok",
		"ai":       "ok",
	}

	statusCode := http.StatusOK

	sqlDB, err := config.DB.DB()
	if err != nil || sqlDB.PingContext(ctx) != nil {
		checks["database"] = "unreachable"
		statusCode = http.StatusServiceUnavailable
	}

	if services.Storage != nil {
		if err := services.Storage.HealthCheck(ctx); err != nil {
			checks["r2"] = err.Error()
			statusCode = http.StatusServiceUnavailable
		}
	} else {
		checks["r2"] = "uninitialized"
		statusCode = http.StatusServiceUnavailable
	}

	if err := checkAIService(ctx); err != nil {
		checks["ai"] = err.Error()
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, gin.H{
		"status": map[bool]string{true: "ready", false: "not_ready"}[statusCode == http.StatusOK],
		"checks": checks,
	})
}

func checkAIService(_ context.Context) error {
	key := aiApiKey()
	if key == "" {
		return errors.New("gemini API key is not configured")
	}
	return nil
}
