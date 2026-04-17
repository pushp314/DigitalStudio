package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

type CreateReviewReq struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
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

	var existingReview models.Review
	if err := config.DB.Where("user_id = ? AND product_id = ?", userID.(uint), product.ID).First(&existingReview).Error; err == nil {
		respondError(c, http.StatusBadRequest, "Review already submitted for this product")
		return
	}

	review := models.Review{
		UserID:    userID.(uint),
		ProductID: product.ID,
		Rating:    req.Rating,
		Comment:   req.Comment,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create review")
		return
	}

	c.JSON(http.StatusCreated, review)
}

func GetReviews(c *gin.Context) {
	productID := c.Param("id")
	var reviews []models.Review
	if err := config.DB.Where("product_id = ?", productID).Preload("User").Find(&reviews).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load reviews")
		return
	}

	c.JSON(http.StatusOK, reviews)
}
