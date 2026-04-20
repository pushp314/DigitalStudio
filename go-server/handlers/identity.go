package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

// RequestGithubChange - User submits a request to link a DIFFERENT github
func RequestGithubChange(c *gin.Context) {
	userID, _ := c.Get("userID")
	var input struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if there is already a pending request
	var existing models.GithubChangeRequest
	if err := config.DB.Where("user_id = ? AND status = ?", userID, "pending").First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You already have a pending identity change request."})
		return
	}

	request := models.GithubChangeRequest{
		UserID: userID.(uint),
		Reason: input.Reason,
		Status: "pending",
	}

	if err := config.DB.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Identity change request submitted to admin for review."})
}

// GetMyGithubRequests - User sees their own requests
func GetMyGithubRequests(c *gin.Context) {
	userID, _ := c.Get("userID")
	var requests []models.GithubChangeRequest
	config.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&requests)
	c.JSON(http.StatusOK, requests)
}

// ADMIN HANDLERS

// GetAllGithubRequests - Admin sees all pending
func GetAllGithubRequests(c *gin.Context) {
	var requests []models.GithubChangeRequest
	config.DB.Preload("User").Order("created_at desc").Find(&requests)
	c.JSON(http.StatusOK, requests)
}

// ResolveGithubRequest - Admin approves or rejects
func ResolveGithubRequest(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"` // approved or rejected
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var request models.GithubChangeRequest
	if err := config.DB.Preload("User").First(&request, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	if request.Resolved {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This request has already been resolved."})
		return
	}

	request.Status = input.Status
	request.Resolved = true

	if input.Status == "approved" {
		// UNLOCK THE IDENTITY
		request.User.Github = ""
		request.User.GithubID = ""
		config.DB.Save(&request.User)
	}

	if err := config.DB.Save(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request resolved successfully."})
}
