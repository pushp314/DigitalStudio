package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

type ValidateLicenseReq struct {
	LicenseKey string `json:"licenseKey" binding:"required"`
	ProductID  uint   `json:"productId"`
}

type IssueLicenseReq struct {
	OrderID uint `json:"orderId" binding:"required"`
}

func MyLicenses(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var licenses []models.License
	if err := config.DB.
		Preload("Product").
		Preload("Order").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&licenses).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch licenses")
		return
	}

	c.JSON(http.StatusOK, licenses)
}

func ValidateLicense(c *gin.Context) {
	var req ValidateLicenseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var license models.License
	query := config.DB.Preload("Product").Preload("Order").Where("license_key = ?", strings.TrimSpace(req.LicenseKey))
	if req.ProductID != 0 {
		query = query.Where("product_id = ?", req.ProductID)
	}
	if err := query.First(&license).Error; err != nil {
		respondError(c, http.StatusNotFound, "License not found")
		return
	}

	valid := strings.EqualFold(license.Status, string(models.LicenseStatusActive)) && (license.ExpiryDate == nil || license.ExpiryDate.After(time.Now()))
	c.JSON(http.StatusOK, gin.H{
		"valid":   valid,
		"license": license,
	})
}

func AdminIssueLicenses(c *gin.Context) {
	var req IssueLicenseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := issueMissingLicensesForOrder(req.OrderID); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to issue licenses")
		return
	}

	var licenses []models.License
	if err := config.DB.Where("order_id = ?", req.OrderID).Find(&licenses).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load issued licenses")
		return
	}

	c.JSON(http.StatusOK, licenses)
}
