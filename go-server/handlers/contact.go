package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func CreateContactInquiry(c *gin.Context) {
	var inquiry models.ContactInquiry
	if err := c.ShouldBindJSON(&inquiry); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	user, _ := optionalAuthenticatedUser(c)
	if user != nil {
		inquiry.UserID = &user.ID
	}

	if err := config.DB.Create(&inquiry).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// 🧠 Advanced Trajectory: Asynchronous AI Enrichment
	go func(id uint, msg string) {
		sentiment, priority := AnalyzeInquiry(msg)
		config.DB.Model(&models.ContactInquiry{}).Where("id = ?", id).Updates(map[string]interface{}{
			"sentiment": sentiment,
			"priority":  priority,
		})
	}(inquiry.ID, inquiry.Message)

	c.JSON(http.StatusOK, gin.H{"message": "Thank you! Your inquiry has been received. Our team will get back to you shortly."})
}

func AdminListInquiries(c *gin.Context) {
	var inquiries []models.ContactInquiry
	if err := config.DB.Order("created_at desc").Find(&inquiries).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch inquiries")
		return
	}

	c.JSON(http.StatusOK, inquiries)
}

func AdminReplyToInquiry(c *gin.Context) {
	id := c.Param("id")
	var inquiry models.ContactInquiry
	if err := config.DB.First(&inquiry, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Inquiry not found")
		return
	}

	var req struct {
		Reply string `json:"reply" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	inquiry.Reply = req.Reply
	inquiry.Status = "replied"

	if err := config.DB.Save(&inquiry).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save reply")
		return
	}

	// Logic for "send them to their account" or "manually reply":
	// In a real system, this would trigger an email or push notification.
	// For this MVP, we simply store it. The frontend will show it in their dashboard if they are logged in.

	c.JSON(http.StatusOK, gin.H{"message": "Reply sent successfully", "inquiry": inquiry})
}

func MyInquiries(c *gin.Context) {
	user, err := optionalAuthenticatedUser(c)
	if err != nil || user == nil {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var inquiries []models.ContactInquiry
	if err := config.DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&inquiries).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch your inquiries")
		return
	}

	c.JSON(http.StatusOK, inquiries)
}

func UserReplyToInquiry(c *gin.Context) {
	user, err := optionalAuthenticatedUser(c)
	if err != nil || user == nil {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	id := c.Param("id")
	var inquiry models.ContactInquiry
	if err := config.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&inquiry).Error; err != nil {
		respondError(c, http.StatusNotFound, "Inquiry not found or access denied")
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Append to message thread logic
	inquiry.Message = inquiry.Message + "\n\nUser Reply: " + req.Message
	inquiry.Status = "pending" // Set back to pending so admin sees it

	if err := config.DB.Save(&inquiry).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save reply")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reply sent to support", "inquiry": inquiry})
}
