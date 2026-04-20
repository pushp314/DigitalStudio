package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
)

type SubmitShowcaseReq struct {
	ProductID  uint   `json:"productId" binding:"required"`
	LiveURL    string `json:"liveUrl" binding:"required"`
	Screenshot string `json:"screenshot"`
}

func SubmitShowcase(c *gin.Context) {
	userId, _ := c.Get("userID")

	var req SubmitShowcaseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	showcase := models.Showcase{
		UserID:     userId.(uint),
		ProductID:  req.ProductID,
		LiveURL:    req.LiveURL,
		Screenshot: req.Screenshot,
		Status:     models.ShowcasePending,
	}

	if err := config.DB.Create(&showcase).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to submit implementation")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Protocol Submitted: Our intelligence unit will verify your deployment shortly.",
		"showcase": showcase,
	})
}

func AdminListShowcases(c *gin.Context) {
	var showcases []models.Showcase
	if err := config.DB.Preload("Product").Order("created_at desc").Find(&showcases).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, showcases)
}

func AdminUpdateShowcaseStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status models.ShowcaseStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var showcase models.Showcase
	if err := config.DB.First(&showcase, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Implementation signal lost")
		return
	}

	showcase.Status = req.Status
	
	// Reward Logic: If Approved and not already paid
	if req.Status == models.ShowcaseApproved && !showcase.RewardPaid {
		var user models.User
		if err := config.DB.First(&user, showcase.UserID).Error; err == nil {
			user.MatrixCredits += 50 // ₹50 reward
			user.TotalDeployments += 1
			services.AwardXP(&user, services.XPDeployment)
			config.DB.Save(&user)
			showcase.RewardPaid = true
			fmt.Printf("Growth Matrix: Credited ₹50 and 1000 XP to UserID %d for Verified Implementation %d\n", user.ID, showcase.ID)
		}
	}

	config.DB.Save(&showcase)
	c.JSON(http.StatusOK, showcase)
}
