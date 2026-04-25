package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
)

// AdminTriggerCartRecovery manually triggers the cart recovery job.
func AdminTriggerCartRecovery(c *gin.Context) {
	go services.RunCartRecoveryJob()
	c.JSON(http.StatusOK, gin.H{"message": "Cart recovery job triggered"})
}

// RunPeriodicJobs is called from main to start the background scheduler.
func RunPeriodicJobs() {
	// Immediate run on startup
	go services.RunCartRecoveryJob()
	
	ticker := time.NewTicker(30 * time.Minute)
	for range ticker.C {
		services.RunCartRecoveryJob()
	}
}

// TrackCheckoutSession records a checkout session for abandoned cart recovery.
func TrackCheckoutSession(c *gin.Context) {
	var req struct {
		Email              string                   `json:"email"`
		CartItems          []map[string]interface{} `json:"cartItems"`
		CartTotal          float64                  `json:"cartTotal"`
		WhiteGloveSelected bool                     `json:"whiteGloveSelected"`
		DeploymentFee      float64                  `json:"deploymentFee"`
		CouponCode         string                   `json:"couponCode"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var userID *uint
	if uid, exists := c.Get("userID"); exists {
		id := uid.(uint)
		userID = &id

		// Get user email if not provided
		if req.Email == "" {
			var user models.User
			if config.DB.Select("email").First(&user, id).Error == nil {
				req.Email = user.Email
			}
		}
	}

	session, err := services.CreateOrUpdateCheckoutSession(services.CheckoutSessionInput{
		UserID:             userID,
		Email:              req.Email,
		CartItems:          req.CartItems,
		CartTotal:          req.CartTotal,
		WhiteGloveSelected: req.WhiteGloveSelected,
		DeploymentFee:      req.DeploymentFee,
		CouponCode:         req.CouponCode,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to track checkout session")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId": session.ID,
		"status":    "tracked",
	})
}

// AdminListAbandonedCarts lists abandoned checkout sessions.
func AdminListAbandonedCarts(c *gin.Context) {
	query := config.DB.Order("created_at desc")

	status := c.DefaultQuery("status", "abandoned")
	if status != "all" {
		query = query.Where("status = ?", status)
	}

	if c.Query("whiteGlove") == "true" {
		query = query.Where("white_glove_selected = ?", true)
	}

	var sessions []models.CheckoutSession
	query.Limit(100).Find(&sessions)

	c.JSON(http.StatusOK, sessions)
}

// AdminGetCartRecoveryStats returns abandoned cart analytics.
func AdminGetCartRecoveryStats(c *gin.Context) {
	stats := services.GetAbandonedCartStats()
	c.JSON(http.StatusOK, stats)
}

// AdminGetCartRecoveryLogs returns recovery email logs for a session.
func AdminGetCartRecoveryLogs(c *gin.Context) {
	sessionID := c.Param("id")
	var logs []models.CartRecoveryLog
	config.DB.Where("checkout_session_id = ?", sessionID).Order("created_at desc").Find(&logs)
	c.JSON(http.StatusOK, logs)
}
