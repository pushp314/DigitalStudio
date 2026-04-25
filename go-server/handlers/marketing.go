package handlers

import (
	"encoding/json"
	"fmt"
	"github.com/pushp314/bizcode/go-server/models"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"time"
)

type MarketingHandler struct {
	DB *gorm.DB
}

func NewMarketingHandler(db *gorm.DB) *MarketingHandler {
	return &MarketingHandler{DB: db}
}

// Admin: List Coupons
func (h *MarketingHandler) ListCoupons(c *gin.Context) {
	var coupons []models.Coupon
	if err := h.DB.Find(&coupons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve coupons"})
		return
	}
	c.JSON(http.StatusOK, coupons)
}

// Admin: Create Coupon
func (h *MarketingHandler) CreateCoupon(c *gin.Context) {
	var req struct {
		Code          string  `json:"code" binding:"required"`
		DiscountType  string  `json:"discountType" binding:"required"`
		DiscountValue float64 `json:"discountValue" binding:"required"`
		MinPurchase   float64 `json:"minPurchase"`
		UsageLimit    int     `json:"usageLimit"`
		ExpiresAt     *string `json:"expiresAt"` // Pointer to string to handle null
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request matrix: " + err.Error()})
		return
	}

	coupon := models.Coupon{
		Code:          models.NormalizeCouponCode(req.Code),
		DiscountType:  models.DiscountType(req.DiscountType),
		DiscountValue: req.DiscountValue,
		MinPurchase:   req.MinPurchase,
		UsageLimit:    req.UsageLimit,
		Active:        true,
	}

	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			// Try a simpler format if RFC3339 fails (for the <input type="date">)
			t, err = time.Parse("2006-01-02", *req.ExpiresAt)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Temporal signature invalid. Use YYYY-MM-DD or RFC3339."})
				return
			}
		}
		coupon.ExpiresAt = &t
	}

	if coupon.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key Code is required for protocol activation"})
		return
	}

	if err := h.DB.Create(&coupon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database write failure: conflict or isolation violation"})
		return
	}
	c.JSON(http.StatusCreated, coupon)
}

// Admin: Update Coupon
func (h *MarketingHandler) UpdateCoupon(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		DiscountValue float64 `json:"discountValue"`
		MinPurchase   float64 `json:"minPurchase"`
		UsageLimit    int     `json:"usageLimit"`
		ExpiresAt     *string `json:"expiresAt"`
		Active        *bool   `json:"active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update matrix: " + err.Error()})
		return
	}

	var coupon models.Coupon
	if err := h.DB.First(&coupon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon node not found"})
		return
	}

	updates := map[string]interface{}{
		"discount_value": req.DiscountValue,
		"min_purchase":   req.MinPurchase,
		"usage_limit":    req.UsageLimit,
	}

	if req.Active != nil {
		updates["active"] = *req.Active
	}

	if req.ExpiresAt != nil {
		if *req.ExpiresAt == "" {
			updates["expires_at"] = nil
		} else {
			t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
			if err != nil {
				t, err = time.Parse("2006-01-02", *req.ExpiresAt)
			}
			if err == nil {
				updates["expires_at"] = &t
			}
		}
	}

	if err := h.DB.Model(&coupon).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database sync failure during modification"})
		return
	}

	c.JSON(http.StatusOK, coupon)
}

// Admin: Revoke (Toggle Active)
func (h *MarketingHandler) RevokeCoupon(c *gin.Context) {
	id := c.Param("id")
	var coupon models.Coupon
	if err := h.DB.First(&coupon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
		return
	}

	coupon.Active = !coupon.Active
	h.DB.Save(&coupon)

	status := "Activated"
	if !coupon.Active {
		status = "Revoked"
	}
	c.JSON(http.StatusOK, gin.H{"message": "Coupon " + status, "active": coupon.Active})
}

// Admin: Hard Delete
func (h *MarketingHandler) HardDeleteCoupon(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Unscoped().Delete(&models.Coupon{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to purge coupon from ledger"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Coupon permanently purged"})
}

// Public: Validate Coupon
func (h *MarketingHandler) ValidateCoupon(c *gin.Context) {
	code := models.NormalizeCouponCode(c.Query("code"))
	scope := strings.TrimSpace(c.Query("scope")) // membership, template, support
	if scope == "" {
		scope = "all"
	}
	amount, err := strconv.ParseFloat(strings.TrimSpace(c.Query("totalAmount")), 64)
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon code is required"})
		return
	}
	if err != nil || amount < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid totalAmount is required"})
		return
	}

	var coupon models.Coupon
	if err := h.DB.Where("code = ? AND active = ?", code, true).First(&coupon).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired coupon"})
		return
	}

	// Basic validation check (amount check might need to be more complex)
	if !coupon.IsValid(amount, scope) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon requirements or scope not met"})
		return
	}

	discount := coupon.CalculateDiscount(amount)
	c.JSON(http.StatusOK, gin.H{
		"code":     coupon.Code,
		"discount": discount,
		"type":     coupon.DiscountType,
	})
}

// Public: Get special deals for abandoned wishlist items
func (h *MarketingHandler) GetWishlistDeals(c *gin.Context) {
	type WishItem struct {
		ID      uint  `json:"id"`
		AddedAt int64 `json:"addedAt"` // Unix timestamp
	}
	var req struct {
		Items []WishItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request matrix"})
		return
	}

	now := time.Now().Unix()
	var deals []gin.H

	for _, item := range req.Items {
		// Hack: If added > 48 hours ago
		if now-item.AddedAt > 172800 {
			var product models.Product
			if err := h.DB.First(&product, item.ID).Error; err == nil {
				deals = append(deals, gin.H{
					"productId": product.ID,
					"title":     product.Title,
					"discount":  0.15, // 15% Off
					"reason":    "Intelligence Recovery: 15% Return Discount Applied",
				})
			}
		}
	}

	c.JSON(http.StatusOK, deals)
}

func (h *MarketingHandler) GetPersonalizedOffers(c *gin.Context) {
	if !h.aiEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI Engine offline"})
		return
	}

	userID, _ := c.Get("userID")
	var req struct {
		WishlistIDs []uint `json:"wishlistIds"`
	}
	c.ShouldBindJSON(&req)

	// Fetch Context
	var orders []models.Order
	h.DB.Preload("OrderItems.Product").Where("user_id = ? AND status = 'paid'", userID).Find(&orders)

	var purchases []string
	for _, o := range orders {
		for _, item := range o.OrderItems {
			purchases = append(purchases, item.Product.Title)
		}
	}

	var wishlist []string
	if len(req.WishlistIDs) > 0 {
		var products []models.Product
		h.DB.Where("id IN ?", req.WishlistIDs).Find(&products)
		for _, p := range products {
			wishlist = append(wishlist, p.Title)
		}
	}

	// AI Strategic Request
	prompt := fmt.Sprintf("Analyze User Profile: Bought: [%s], Wants: [%s].\nGenerate a 'Limited Time VIP Offer'. Return ONLY a JSON object: {\"offerTitle\": \"string\", \"pitch\": \"short 10 word pitch\", \"discount\": number, \"code\": \"GEN-CODE\", \"expiryHours\": number}",
		strings.Join(purchases, ", "), strings.Join(wishlist, ", "))

	answer, err := requestAIAnswer(prompt)
	if err != nil {
		// Fallback
		c.JSON(http.StatusOK, gin.H{
			"offerTitle":  "Creator Loyalty Reward",
			"pitch":       "Since you're growing with us, here is a special return gift.",
			"discount":    15,
			"code":        "GROWTH15",
			"expiryHours": 24,
		})
		return
	}

	// Simple extraction
	cleanJSON := answer
	if strings.Contains(cleanJSON, "{") {
		cleanJSON = "{" + strings.Split(cleanJSON, "{")[1]
		cleanJSON = strings.Split(cleanJSON, "}")[0] + "}"
	}

	var offer struct {
		OfferTitle  string `json:"offerTitle"`
		Pitch       string `json:"pitch"`
		Discount    int    `json:"discount"`
		Code        string `json:"code"`
		ExpiryHours int    `json:"expiryHours"`
	}

	if err := json.Unmarshal([]byte(cleanJSON), &offer); err != nil {
		// Fallback
		c.JSON(http.StatusOK, gin.H{
			"offerTitle":  "Creator Loyalty Reward",
			"pitch":       "Since you're growing with us, here is a special return gift.",
			"discount":    15,
			"code":        "GROWTH15",
			"expiryHours": 24,
		})
		return
	}

	c.JSON(http.StatusOK, offer)
}

func (h *MarketingHandler) aiEnabled() bool {
	return aiEnabled()
}
