package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
)

type CreateReviewReq struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type UpdateReviewReq struct {
	Status           *string `json:"status"`
	VerifiedPurchase *bool   `json:"verifiedPurchase"`
}

func CreateReview(c *gin.Context) {
	productID := c.Param("id")
	userID, _ := c.Get("userID")

	var req CreateReviewReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var product models.Product
	if err := config.DB.First(&product, productID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	hasPurchased, err := userHasPaidOrderForProduct(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify purchase eligibility")
		return
	}
	if !hasPurchased {
		respondError(c, http.StatusForbidden, "Purchase required before leaving a review")
		return
	}

	alreadyReviewed, err := hasExistingReview(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify existing review")
		return
	}
	if alreadyReviewed {
		respondError(c, http.StatusBadRequest, "Review already submitted for this product")
		return
	}

	review := models.Review{
		UserID:           userID.(uint),
		ProductID:        product.ID,
		Rating:           req.Rating,
		Comment:          req.Comment,
		Status:           "approved",
		VerifiedPurchase: true,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create review")
		return
	}

	// Reward verified feedback
	var user models.User
	config.DB.First(&user, userID)
	services.AwardXP(&user, services.XPReviewAdded)
	config.DB.Save(&user)

	c.JSON(http.StatusCreated, review)
}

func GetReviewEligibility(c *gin.Context) {
	productID := c.Param("id")
	userID, _ := c.Get("userID")

	var product models.Product
	if err := config.DB.First(&product, productID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	hasPurchased, err := userHasPaidOrderForProduct(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify purchase eligibility")
		return
	}

	alreadyReviewed, err := hasExistingReview(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify review history")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hasPurchased":   hasPurchased,
		"alreadyReviewed": alreadyReviewed,
		"canReview":      hasPurchased && !alreadyReviewed,
	})
}

func GetReviews(c *gin.Context) {
	productID := c.Param("id")
	var reviews []models.Review
	if err := config.DB.
		Where("product_id = ? AND status = ?", productID, "approved").
		Preload("User").
		Order("created_at desc").
		Find(&reviews).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load reviews")
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func AdminListReviews(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	var reviews []models.Review
	query := config.DB.Preload("User").Preload("Product").Order("created_at desc")
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if err := query.Find(&reviews).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch reviews")
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func AdminUpdateReview(c *gin.Context) {
	id := c.Param("id")
	var review models.Review
	if err := config.DB.First(&review, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Review not found")
		return
	}

	var req UpdateReviewReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Status != nil {
		status := strings.TrimSpace(strings.ToLower(*req.Status))
		if status != "approved" && status != "hidden" && status != "pending" {
			respondError(c, http.StatusBadRequest, "Unsupported review status")
			return
		}
		review.Status = status
	}
	if req.VerifiedPurchase != nil {
		review.VerifiedPurchase = *req.VerifiedPurchase
	}

	if err := config.DB.Save(&review).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update review")
		return
	}

	if err := config.DB.Preload("User").Preload("Product").First(&review, review.ID).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reload review")
		return
	}

	c.JSON(http.StatusOK, review)
}

func AdminDeleteReview(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Review{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to delete review")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}
