package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"github.com/pushp314/digitalstudio/go-server/models"
	"net/http"
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
	var coupon models.Coupon
	if err := c.ShouldBindJSON(&coupon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Create(&coupon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create coupon"})
		return
	}
	c.JSON(http.StatusCreated, coupon)
}

// Admin: Delete Coupon
func (h *MarketingHandler) DeleteCoupon(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&models.Coupon{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove coupon"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Coupon deactivated"})
}

// Public: Validate Coupon
func (h *MarketingHandler) ValidateCoupon(c *gin.Context) {
	code := c.Query("code")
	amount := c.GetFloat64("totalAmount") // Total potentially passed from frontend or calculated previously

	var coupon models.Coupon
	if err := h.DB.Where("code = ? AND active = ?", code, true).First(&coupon).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired coupon"})
		return
	}

	// Basic validation check (amount check might need to be more complex)
	if !coupon.IsValid(amount) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon requirements not met"})
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
		if now - item.AddedAt > 172800 { 
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

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  h.aiModel(),
	})

	resp, err := http.Post(h.aiServiceURL()+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI connectivity issue"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	json.Unmarshal(bodyBytes, &aiResp)

	// Simple extraction
	cleanJSON := aiResp.Answer
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
			"offerTitle": "Creator Loyalty Reward",
			"pitch": "Since you're growing with us, here is a special return gift.",
			"discount": 15,
			"code": "GROWTH15",
			"expiryHours": 24,
		})
		return
	}

	c.JSON(http.StatusOK, offer)
}

func (h *MarketingHandler) aiEnabled() bool {
	// Simple reuse of check config
	return true 
}
func (h *MarketingHandler) aiModel() string { return "qwen3.5:2b" }
func (h *MarketingHandler) aiServiceURL() string { return "http://localhost:8081" }
