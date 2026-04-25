package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ==================== PARTNER / AFFILIATE PUBLIC ENDPOINTS ====================

// AffiliateApply creates a new affiliate application.
func AffiliateApply(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req struct {
		DisplayName string `json:"displayName"`
		PayoutEmail string `json:"payoutEmail"`
	}
	c.ShouldBindJSON(&req)

	affiliate, err := services.ApplyForAffiliate(userID.(uint), req.DisplayName, req.PayoutEmail)
	if err != nil {
		if err == services.ErrAlreadyAffiliate {
			respondError(c, http.StatusConflict, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to submit application")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"affiliate": affiliate,
		"message":   "Application submitted for review",
	})
}

// AffiliateDashboard returns the affiliate's dashboard data.
func AffiliateDashboard(c *gin.Context) {
	userID, _ := c.Get("userID")

	var affiliate models.Affiliate
	if err := config.DB.Where("user_id = ?", userID).First(&affiliate).Error; err != nil {
		respondError(c, http.StatusNotFound, "Affiliate account not found. Apply first.")
		return
	}

	// Recent conversions
	var conversions []models.AffiliateConversion
	config.DB.Where("affiliate_id = ?", affiliate.ID).
		Order("created_at desc").Limit(20).Find(&conversions)

	// Recent clicks (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var clickCount int64
	config.DB.Model(&models.AffiliateClick{}).
		Where("affiliate_id = ? AND created_at > ?", affiliate.ID, thirtyDaysAgo).
		Count(&clickCount)

	// Payout requests
	var payouts []models.AffiliatePayoutRequest
	config.DB.Where("affiliate_id = ?", affiliate.ID).
		Order("created_at desc").Limit(10).Find(&payouts)

	c.JSON(http.StatusOK, gin.H{
		"affiliate":        affiliate,
		"recentConversions": conversions,
		"clicksLast30Days": clickCount,
		"payoutRequests":   payouts,
	})
}

// AffiliateLinks returns the affiliate's referral links.
func AffiliateLinks(c *gin.Context) {
	userID, _ := c.Get("userID")

	var affiliate models.Affiliate
	if err := config.DB.Where("user_id = ?", userID).First(&affiliate).Error; err != nil {
		respondError(c, http.StatusNotFound, "Affiliate account not found")
		return
	}

	var siteConfig models.SiteConfig
	config.DB.Order("id desc").First(&siteConfig)

	baseURL := strings.TrimSuffix(siteConfig.FrontendURL, "/")
	if baseURL == "" {
		baseURL = "https://bizcode.dev"
	}

	c.JSON(http.StatusOK, gin.H{
		"referralCode": affiliate.ReferralCode,
		"links": gin.H{
			"homepage": baseURL + "?ref=" + affiliate.ReferralCode,
			"apps":     baseURL + "/apps?ref=" + affiliate.ReferralCode,
			"pricing":  baseURL + "/pricing?ref=" + affiliate.ReferralCode,
		},
	})
}

// AffiliateConversions returns conversion history.
func AffiliateConversions(c *gin.Context) {
	userID, _ := c.Get("userID")

	var affiliate models.Affiliate
	if err := config.DB.Where("user_id = ?", userID).First(&affiliate).Error; err != nil {
		respondError(c, http.StatusNotFound, "Affiliate account not found")
		return
	}

	var conversions []models.AffiliateConversion
	query := config.DB.Where("affiliate_id = ?", affiliate.ID).Order("created_at desc")

	if status := c.Query("status"); status != "" {
		query = query.Where("commission_status = ?", status)
	}

	query.Find(&conversions)
	c.JSON(http.StatusOK, conversions)
}

// AffiliateRequestPayout submits a payout request.
func AffiliateRequestPayout(c *gin.Context) {
	userID, _ := c.Get("userID")

	var affiliate models.Affiliate
	if err := config.DB.Where("user_id = ?", userID).First(&affiliate).Error; err != nil {
		respondError(c, http.StatusNotFound, "Affiliate account not found")
		return
	}

	var req struct {
		Amount float64 `json:"amount" binding:"required"`
		Method string  `json:"method"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	payout, err := services.RequestAffiliatePayout(affiliate.ID, req.Amount, req.Method)
	if err != nil {
		if err == services.ErrInsufficientBalance {
			respondError(c, http.StatusBadRequest, err.Error())
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to submit payout request")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payout":  payout,
		"message": "Payout request submitted for review",
	})
}

// TrackReferralClick tracks a click from a referral link (public, no auth).
func TrackReferralClick(c *gin.Context) {
	var req struct {
		ReferralCode string `json:"referralCode" binding:"required"`
		ProductID    *uint  `json:"productId"`
		LandingURL   string `json:"landingUrl"`
		VisitorID    string `json:"visitorId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	services.TrackAffiliateClick(req.ReferralCode, req.ProductID, req.LandingURL, req.VisitorID, c.ClientIP(), c.GetHeader("User-Agent"))
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ==================== ADMIN AFFILIATE ENDPOINTS ====================

// AdminListAffiliates lists all affiliates.
func AdminListAffiliates(c *gin.Context) {
	query := config.DB.Preload("User").Order("created_at desc")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var affiliates []models.Affiliate
	query.Find(&affiliates)

	c.JSON(http.StatusOK, affiliates)
}

// AdminGetAffiliate returns a single affiliate with details.
func AdminGetAffiliate(c *gin.Context) {
	id := c.Param("id")
	var affiliate models.Affiliate
	if err := config.DB.Preload("User").Preload("Conversions").Preload("PayoutRequests").
		First(&affiliate, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Affiliate not found")
		return
	}
	c.JSON(http.StatusOK, affiliate)
}

// AdminApproveAffiliate approves an affiliate application.
func AdminApproveAffiliate(c *gin.Context) {
	id := c.Param("id")
	now := time.Now()
	if err := config.DB.Model(&models.Affiliate{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":      string(models.AffiliateStatusApproved),
			"approved_at": now,
		}).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to approve affiliate")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Affiliate approved"})
}

// AdminRejectAffiliate rejects an affiliate application.
func AdminRejectAffiliate(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Notes string `json:"notes"`
	}
	c.ShouldBindJSON(&req)

	if err := config.DB.Model(&models.Affiliate{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status": string(models.AffiliateStatusRejected),
			"notes":  req.Notes,
		}).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reject affiliate")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Affiliate rejected"})
}

// AdminSuspendAffiliate suspends an affiliate.
func AdminSuspendAffiliate(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Model(&models.Affiliate{}).Where("id = ?", id).
		Update("status", string(models.AffiliateStatusSuspended)).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to suspend affiliate")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Affiliate suspended"})
}

// AdminListAffiliatePayouts lists payout requests.
func AdminListAffiliatePayouts(c *gin.Context) {
	query := config.DB.Preload("Affiliate").Preload("Affiliate.User").Order("created_at desc")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var payouts []models.AffiliatePayoutRequest
	query.Find(&payouts)

	c.JSON(http.StatusOK, payouts)
}

// AdminApproveAffiliatePayout approves a payout request.
func AdminApproveAffiliatePayout(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	now := time.Now()

	if err := config.DB.Model(&models.AffiliatePayoutRequest{}).Where("id = ? AND status = ?", id, "pending").
		Updates(map[string]interface{}{
			"status":      "approved",
			"reviewed_at": now,
		}).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to approve payout")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Payout approved"})
}

// AdminPayAffiliatePayout marks a payout as paid.
func AdminPayAffiliatePayout(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var payout models.AffiliatePayoutRequest
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&payout, id).Error; err != nil {
			return err
		}

		if payout.Status == "paid" {
			return errors.New("payout already paid")
		}

		now := time.Now()
		if err := tx.Model(&payout).Updates(map[string]interface{}{
			"status":  "paid",
			"paid_at": now,
		}).Error; err != nil {
			return err
		}

		// Deduct from pending, add to paid
		if err := tx.Model(&models.Affiliate{}).Where("id = ?", payout.AffiliateID).
			Updates(map[string]interface{}{
				"pending_balance": gorm.Expr("GREATEST(pending_balance - ?, 0)", payout.Amount),
				"paid_balance":    gorm.Expr("paid_balance + ?", payout.Amount),
			}).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to process payout: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payout marked as paid"})
}
