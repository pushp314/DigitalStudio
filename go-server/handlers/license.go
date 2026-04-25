package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
)

// ==================== PUBLIC / USER LICENSE ENDPOINTS ====================

// MyLicenses returns all licenses owned by the authenticated user.
func MyLicenses(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var licenses []models.License
	if err := config.DB.
		Preload("Product").
		Preload("Activations", "status = ?", "active").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&licenses).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch licenses")
		return
	}

	// Include public key for client-side verification
	c.JSON(http.StatusOK, gin.H{
		"licenses":  licenses,
		"publicKey": services.GetPublicKeyBase64(),
	})
}

// GetLicenseToken returns the signed token for a specific license.
func GetLicenseToken(c *gin.Context) {
	userID, _ := c.Get("userID")
	id := c.Param("id")

	var license models.License
	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&license).Error; err != nil {
		respondError(c, http.StatusNotFound, "License not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"signedToken": license.SignedToken,
		"licenseKey":  license.LicenseKey,
		"publicId":    license.PublicID,
		"publicKey":   services.GetPublicKeyBase64(),
	})
}

// ActivateLicense binds a license to a fingerprint.
func ActivateLicenseHandler(c *gin.Context) {
	var req struct {
		LicenseKey       string `json:"licenseKey" binding:"required"`
		FingerprintType  string `json:"fingerprintType" binding:"required"`
		FingerprintValue string `json:"fingerprintValue" binding:"required"`
		AppVersion       string `json:"appVersion"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	activation, err := services.ActivateLicense(
		config.DB, req.LicenseKey, req.FingerprintType, req.FingerprintValue,
		ip, userAgent, req.AppVersion,
	)
	if err != nil {
		status := http.StatusInternalServerError
		switch err {
		case services.ErrLicenseNotFound:
			status = http.StatusNotFound
		case services.ErrLicenseInactive:
			status = http.StatusForbidden
		case services.ErrActivationLimitReached:
			status = http.StatusConflict
		case services.ErrFingerprintRequired:
			status = http.StatusBadRequest
		}
		respondError(c, status, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activation": activation,
		"message":    "License activated successfully",
	})
}

// VerifyLicenseHandler checks license validity and activation status.
func VerifyLicenseHandler(c *gin.Context) {
	var req struct {
		LicenseKey       string `json:"licenseKey" binding:"required"`
		FingerprintType  string `json:"fingerprintType"`
		FingerprintValue string `json:"fingerprintValue"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	license, valid, err := services.VerifyLicense(
		config.DB, req.LicenseKey, req.FingerprintType, req.FingerprintValue, c.ClientIP(),
	)
	if err != nil {
		if err == services.ErrLicenseNotFound {
			respondError(c, http.StatusNotFound, "License not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "Verification failed")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   valid,
		"license": license,
	})
}

// HeartbeatLicenseHandler updates last-seen for a license activation.
func HeartbeatLicenseHandler(c *gin.Context) {
	var req struct {
		LicenseKey       string `json:"licenseKey" binding:"required"`
		FingerprintType  string `json:"fingerprintType" binding:"required"`
		FingerprintValue string `json:"fingerprintValue" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := services.HeartbeatLicense(config.DB, req.LicenseKey, req.FingerprintType, req.FingerprintValue, c.ClientIP()); err != nil {
		if err == services.ErrLicenseNotFound {
			respondError(c, http.StatusNotFound, "License not found")
			return
		}
		respondError(c, http.StatusForbidden, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DeactivateLicenseHandler allows a user to deactivate their own activation.
func DeactivateLicenseHandler(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		LicenseID    uint `json:"licenseId" binding:"required"`
		ActivationID uint `json:"activationId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify ownership
	var license models.License
	if err := config.DB.Where("id = ? AND user_id = ?", req.LicenseID, userID).First(&license).Error; err != nil {
		respondError(c, http.StatusNotFound, "License not found or access denied")
		return
	}

	uid := userID.(uint)
	if err := services.DeactivateLicenseActivation(config.DB, req.LicenseID, req.ActivationID, &uid); err != nil {
		switch err {
		case services.ErrDeactivationDenied:
			respondError(c, http.StatusForbidden, err.Error())
		case services.ErrActivationNotFound:
			respondError(c, http.StatusNotFound, err.Error())
		default:
			respondError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Activation deactivated successfully"})
}

// ==================== ADMIN LICENSE ENDPOINTS ====================

// AdminListLicenses lists all licenses with filters.
func AdminListLicenses(c *gin.Context) {
	query := config.DB.Preload("Product").Preload("User").Order("created_at desc")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if productID := c.Query("productId"); productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if userID := c.Query("userId"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		query = query.Where("license_key ILIKE ? OR public_id ILIKE ? OR customer_email ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 50 }

	var total int64
	query.Model(&models.License{}).Count(&total)

	var licenses []models.License
	if err := query.Offset((page - 1) * limit).Limit(limit).Find(&licenses).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch licenses")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"licenses": licenses,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// AdminGetLicense returns a single license with full details.
func AdminGetLicense(c *gin.Context) {
	id := c.Param("id")
	var license models.License
	if err := config.DB.
		Preload("Product").
		Preload("User").
		Preload("Order").
		Preload("Activations").
		First(&license, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "License not found")
		return
	}
	c.JSON(http.StatusOK, license)
}

// AdminGetLicenseActivations returns activations for a license.
func AdminGetLicenseActivations(c *gin.Context) {
	id := c.Param("id")
	var activations []models.LicenseActivation
	if err := config.DB.Where("license_id = ?", id).Order("created_at desc").Find(&activations).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch activations")
		return
	}
	c.JSON(http.StatusOK, activations)
}

// AdminGetLicenseEvents returns event history for a license.
func AdminGetLicenseEvents(c *gin.Context) {
	id := c.Param("id")
	var events []models.LicenseEvent
	if err := config.DB.Where("license_id = ?", id).Order("created_at desc").Find(&events).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch events")
		return
	}
	c.JSON(http.StatusOK, events)
}

// AdminIssueLicenses issues missing licenses for a paid order.
func AdminIssueLicenses(c *gin.Context) {
	var req struct {
		OrderID uint `json:"orderId" binding:"required"`
	}
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

// AdminRevokeLicense revokes a license.
func AdminRevokeLicense(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	actorID := getActorID(c)
	if err := services.RevokeLicense(config.DB, uint(id), req.Reason, actorID); err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "License revoked"})
}

// AdminSuspendLicense suspends a license.
func AdminSuspendLicense(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	actorID := getActorID(c)
	if err := services.SuspendLicense(config.DB, uint(id), req.Reason, actorID); err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "License suspended"})
}

// AdminReactivateLicense reactivates a suspended license.
func AdminReactivateLicense(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	actorID := getActorID(c)
	if err := services.ReactivateLicense(config.DB, uint(id), actorID); err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "License reactivated"})
}

// AdminRemoveActivation forcefully removes an activation.
func AdminRemoveActivation(c *gin.Context) {
	licenseID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	activationID, _ := strconv.ParseUint(c.Param("activationId"), 10, 64)
	actorID := getActorID(c)

	if err := services.DeactivateLicenseActivation(config.DB, uint(licenseID), uint(activationID), actorID); err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Activation removed"})
}

// AdminGetProductPolicy returns the license policy for a product.
func AdminGetProductPolicy(c *gin.Context) {
	productID := c.Param("productId")
	var policy models.ProductLicensePolicy
	if err := config.DB.Where("product_id = ?", productID).First(&policy).Error; err != nil {
		// Return defaults
		c.JSON(http.StatusOK, gin.H{
			"policy":  nil,
			"message": "No custom policy found, defaults apply",
		})
		return
	}
	c.JSON(http.StatusOK, policy)
}

// AdminUpsertProductPolicy creates or updates a product license policy.
func AdminUpsertProductPolicy(c *gin.Context) {
	productID, _ := strconv.ParseUint(c.Param("productId"), 10, 64)
	var req models.ProductLicensePolicy
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	req.ProductID = uint(productID)

	var existing models.ProductLicensePolicy
	if err := config.DB.Where("product_id = ?", productID).First(&existing).Error; err == nil {
		req.ID = existing.ID
	}

	if err := config.DB.Save(&req).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save policy")
		return
	}
	c.JSON(http.StatusOK, req)
}

func getActorID(c *gin.Context) *uint {
	if uid, exists := c.Get("userID"); exists {
		id := uid.(uint)
		return &id
	}
	return nil
}
