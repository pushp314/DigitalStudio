package services

import (
	"errors"
	"strings"
	"time"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrAffiliateNotFound    = errors.New("affiliate not found")
	ErrAlreadyAffiliate     = errors.New("you already have an affiliate account")
	ErrSelfReferral         = errors.New("self-referral is not allowed")
	ErrDuplicateConversion  = errors.New("commission already recorded for this order")
	ErrInsufficientBalance  = errors.New("insufficient balance for payout")
)

// ApplyForAffiliate creates a new affiliate application.
func ApplyForAffiliate(userID uint, displayName string, payoutEmail string) (*models.Affiliate, error) {
	// Check if already exists
	var existing models.Affiliate
	if err := config.DB.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		return nil, ErrAlreadyAffiliate
	}

	// Get user for code generation
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return nil, err
	}

	code := utils.GeneratePartnerCode(displayName)
	if displayName == "" {
		displayName = user.Name
	}
	if payoutEmail == "" {
		payoutEmail = user.Email
	}

	affiliate := models.Affiliate{
		UserID:          userID,
		Status:          string(models.AffiliateStatusPending),
		DisplayName:     displayName,
		ReferralCode:    code,
		CommissionType:  "percentage",
		CommissionValue: 10,
		PayoutEmail:     payoutEmail,
	}

	if err := config.DB.Create(&affiliate).Error; err != nil {
		return nil, err
	}
	return &affiliate, nil
}

// TrackAffiliateClick records a click on an affiliate link.
func TrackAffiliateClick(referralCode string, productID *uint, landingURL string, visitorID string, ip string, userAgent string) error {
	referralCode = strings.TrimSpace(strings.ToUpper(referralCode))
	if referralCode == "" {
		return nil
	}

	var affiliate models.Affiliate
	if err := config.DB.Where("referral_code = ? AND status = ?",
		referralCode, string(models.AffiliateStatusApproved)).First(&affiliate).Error; err != nil {
		return nil // Silently ignore invalid codes
	}

	click := models.AffiliateClick{
		AffiliateID:  affiliate.ID,
		ProductID:    productID,
		ReferralCode: referralCode,
		LandingURL:   truncateStr(landingURL, 512),
		VisitorID:    truncateStr(visitorID, 255),
		IP:           truncateStr(ip, 100),
		UserAgent:    truncateStr(userAgent, 512),
	}

	config.DB.Create(&click)

	// Increment click count
	config.DB.Model(&affiliate).UpdateColumn("total_clicks", gorm.Expr("total_clicks + 1"))

	return nil
}

// CreateAffiliateConversion records a conversion when a referred order is paid.
func CreateAffiliateConversion(tx *gorm.DB, order *models.Order, referrerUserID uint) error {
	if tx == nil || order == nil {
		return nil
	}

	// Self-referral check
	if order.UserID == referrerUserID {
		return ErrSelfReferral
	}

	// Find affiliate by user ID
	var affiliate models.Affiliate
	if err := tx.Where("user_id = ? AND status = ?",
		referrerUserID, string(models.AffiliateStatusApproved)).First(&affiliate).Error; err != nil {
		return nil // Not an affiliate, skip
	}

	// Check for duplicate conversion
	var existingCount int64
	tx.Model(&models.AffiliateConversion{}).Where("affiliate_id = ? AND order_id = ?",
		affiliate.ID, order.ID).Count(&existingCount)
	if existingCount > 0 {
		return nil // Already recorded
	}

	// Calculate commission
	var commissionAmount float64
	if affiliate.CommissionType == "percentage" {
		commissionAmount = roundCurrency(order.TotalPrice * affiliate.CommissionValue / 100)
	} else {
		commissionAmount = roundCurrency(affiliate.CommissionValue)
	}

	// Create single conversion record for the order
	conversion := models.AffiliateConversion{
		AffiliateID:      affiliate.ID,
		OrderID:          order.ID,
		UserID:           &order.UserID,
		ProductID:        0, // order-level, not per-product
		CommissionAmount: commissionAmount,
		CommissionStatus: string(models.CommissionPending),
		ConversionSource: "referral",
	}
	if len(order.OrderItems) > 0 {
		conversion.ProductID = order.OrderItems[0].ProductID
	}
	if err := tx.Create(&conversion).Error; err != nil {
		return err
	}

	// Update affiliate stats
	tx.Model(&affiliate).Updates(map[string]interface{}{
		"total_conversions": gorm.Expr("total_conversions + 1"),
		"total_earnings":    gorm.Expr("total_earnings + ?", commissionAmount),
		"pending_balance":   gorm.Expr("pending_balance + ?", commissionAmount),
	})

	return nil
}

// RequestAffiliatePayout creates a payout request.
func RequestAffiliatePayout(affiliateID uint, amount float64, method string) (*models.AffiliatePayoutRequest, error) {
	var affiliate models.Affiliate
	if err := config.DB.Clauses(clause.Locking{Strength: "UPDATE"}).First(&affiliate, affiliateID).Error; err != nil {
		return nil, ErrAffiliateNotFound
	}

	if affiliate.PendingBalance < amount || amount <= 0 {
		return nil, ErrInsufficientBalance
	}

	payout := models.AffiliatePayoutRequest{
		AffiliateID: affiliateID,
		Amount:      amount,
		Status:      "pending",
		Method:      method,
		RequestedAt: time.Now(),
	}

	if err := config.DB.Create(&payout).Error; err != nil {
		return nil, err
	}

	return &payout, nil
}

func truncateStr(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}
