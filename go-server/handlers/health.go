package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/services"
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

	if err := services.CheckR2(ctx); err != nil {
		checks["r2"] = err.Error()
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

func checkAIService(ctx context.Context) error {
	serviceURL := aiServiceURL()
	if serviceURL == "" {
		return errors.New("ai service is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, serviceURL+"/healthz", nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return errors.New("ai service healthcheck failed")
	}

	return nil
}
