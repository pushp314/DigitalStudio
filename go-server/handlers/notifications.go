package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

// AdminBroadcastNotification sends a real-time alert to all connected users
func AdminBroadcastNotification(c *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
		Type    string `json:"type" binding:"required"` // info, success, warning, error, alert
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	notification := models.Notification{
		Title:     req.Title,
		Message:   req.Message,
		Type:      req.Type,
		Target:    "all",
		CreatedAt: time.Now(),
	}

	// Persist to DB
	config.DB.AutoMigrate(&models.Notification{})
	if err := config.DB.Create(&notification).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save notification")
		return
	}

	// Broadcast via the Chat Hub (since it's already connected to all active users)
	payload := gin.H{
		"type":    "notification",
		"id":      notification.ID,
		"title":   notification.Title,
		"message": notification.Message,
		"style":   notification.Type,
		"time":    notification.CreatedAt,
	}

	p, _ := json.Marshal(payload)
	
	// Non-blocking broadcast to all active sessions
	select {
	case GlobalHub.Broadcast <- p:
	default:
		go func() { GlobalHub.Broadcast <- p }()
	}

	c.JSON(http.StatusOK, notification)
}

func GetMyNotifications(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	var notifications []models.Notification
	err := config.DB.Where("target = ? OR user_id = ?", "all", userID).
		Order("created_at desc").
		Limit(20).
		Find(&notifications).Error

	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch notifications")
		return
	}

	c.JSON(http.StatusOK, notifications)
}
