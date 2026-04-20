package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"gorm.io/gorm"
	"strconv"
)

type CreateTestimonialReq struct {
	ProductID uint   `json:"productId" binding:"required"`
	Content   string `json:"content" binding:"required"`
	Rating    int    `json:"rating"`
}

func CreateTestimonial(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateTestimonialReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Rating == 0 {
		req.Rating = 5
	}

	hasPurchased, err := userHasPaidOrderForProduct(userID.(uint), req.ProductID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify purchase eligibility")
		return
	}
	if !hasPurchased {
		respondError(c, http.StatusForbidden, "Only users who purchased this product can submit a testimonial")
		return
	}

	var existing models.Testimonial
	err = config.DB.Where("user_id = ? AND product_id = ?", userID.(uint), req.ProductID).First(&existing).Error
	if err == nil {
		respondError(c, http.StatusBadRequest, "You have already submitted a testimonial for this product")
		return
	}
	if err != gorm.ErrRecordNotFound {
		respondError(c, http.StatusInternalServerError, "Failed to validate testimonial history")
		return
	}

	testimonial := models.Testimonial{
		UserID:    userID.(uint),
		ProductID: req.ProductID,
		Content:   strings.TrimSpace(req.Content),
		Rating:    req.Rating,
		Status:    "pending",
	}

	if err := config.DB.Create(&testimonial).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create testimonial")
		return
	}

	if err := config.DB.Preload("User").Preload("Product").First(&testimonial, testimonial.ID).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load testimonial")
		return
	}

	c.JSON(http.StatusCreated, testimonial)
}

func GetApprovedTestimonials(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))

	if page < 1 { page = 1 }
	if limit < 1 || limit > 50 { limit = 12 }
	offset := (page - 1) * limit

	var testimonials []models.Testimonial
	query := config.DB.Where("status = ?", "approved")
	
	var total int64
	query.Model(&models.Testimonial{}).Count(&total)

	if err := query.
		Preload("User").
		Preload("Product").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&testimonials).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch testimonials")
		return
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.JSON(http.StatusOK, testimonials)
}

func AdminListTestimonials(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 50 }
	offset := (page - 1) * limit

	var testimonials []models.Testimonial
	query := config.DB.Preload("User").Preload("Product").Order("created_at desc")
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Model(&models.Testimonial{}).Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&testimonials).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch testimonials")
		return
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.JSON(http.StatusOK, testimonials)
}

func AdminApproveTestimonial(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Model(&models.Testimonial{}).Where("id = ?", id).Update("status", "approved").Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to approve testimonial")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Testimonial approved"})
}

func AdminRejectTestimonial(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Model(&models.Testimonial{}).Where("id = ?", id).Update("status", "rejected").Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reject testimonial")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Testimonial rejected"})
}

func AdminDeleteTestimonial(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Testimonial{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to delete testimonial")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Testimonial deleted"})
}
