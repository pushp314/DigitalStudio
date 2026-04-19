package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	razorpay "github.com/razorpay/razorpay-go"
)

type CreatePaymentOrderReq struct {
	Items      []OrderItemReq `json:"items" binding:"required,min=1"`
	CouponCode string         `json:"couponCode"`
}

func CreateRazorpayOrder(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreatePaymentOrderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var total float64
	var orderItems []models.OrderItem
	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	if keyID == "" || keySecret == "" {
		respondError(c, http.StatusInternalServerError, "Razorpay credentials are not configured")
		return
	}

	for _, itemReq := range req.Items {
		var product models.Product
		if err := config.DB.First(&product, itemReq.ProductID).Error; err != nil {
			respondError(c, http.StatusBadRequest, fmt.Sprintf("Product ID %d not found", itemReq.ProductID))
			return
		}

		price := product.Price
		total += price * float64(itemReq.Quantity)
		orderItems = append(orderItems, models.OrderItem{ProductID: product.ID, Quantity: itemReq.Quantity, Price: price})
	}

	// Apply Coupon if present
	var discount float64
	if req.CouponCode != "" {
		var coupon models.Coupon
		if err := config.DB.Where("code = ? AND active = ?", req.CouponCode, true).First(&coupon).Error; err == nil {
			if coupon.IsValid(total) {
				discount = coupon.CalculateDiscount(total)
				total = total - discount
				if total < 0 {
					total = 0
				}
				// Increment usage count
				coupon.UsageCount++
				config.DB.Save(&coupon)
			}
		}
	}

	order := models.Order{
		UserID:            userID.(uint),
		TotalPrice:        total, // Total is now discounted
		Status:            "pending",
		PaymentStatus:     "pending",
		EntitlementStatus: "auto",
		OrderItems:        orderItems,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create local order")
		return
	}

	client := razorpay.NewClient(keyID, keySecret)

	amountPaise := int64(total * 100)
	data := map[string]interface{}{
		"amount":          amountPaise,
		"currency":        "INR",
		"receipt":         fmt.Sprintf("receipt_order_%d", order.ID),
		"payment_capture": 1,
	}

	razorpayOrder, err := client.Order.Create(data, nil)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to generate Razorpay order")
		return
	}

	order.RazorpayOrderID = razorpayOrder["id"].(string)
	config.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{
		"localOrderId": order.ID,
		"orderId":  order.RazorpayOrderID,
		"amount":       amountPaise,
		"currency":     "INR",
		"keyId":        keyID,
		"paymentStatus": order.PaymentStatus,
	})
}

type PaymentVerifyReq struct {
	RazorpayOrderID   string `json:"razorpayOrderId" binding:"required"`
	RazorpayPaymentID string `json:"razorpayPaymentId" binding:"required"`
	RazorpaySignature string `json:"razorpaySignature" binding:"required"`
}

func VerifyRazorpayPayment(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req PaymentVerifyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	secret := os.Getenv("RAZORPAY_KEY_SECRET")
	data := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if expectedSignature != req.RazorpaySignature {
		respondError(c, http.StatusForbidden, "Invalid payment signature")
		return
	}

	var order models.Order
	if err := config.DB.Where("razorpay_order_id = ?", req.RazorpayOrderID).First(&order).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}
	if order.UserID != userID.(uint) {
		respondError(c, http.StatusForbidden, "You are not allowed to verify this order")
		return
	}

	keyID := os.Getenv("RAZORPAY_KEY_ID")
	client := razorpay.NewClient(keyID, secret)
	paymentData, err := client.Payment.Fetch(req.RazorpayPaymentID, nil, nil)

	if err != nil || paymentData["status"] != "captured" {
		respondError(c, http.StatusBadRequest, "Payment not explicitly captured")
		return
	}

	order.Status = "paid"
	order.PaymentStatus = "paid"
	order.RazorpayPaymentID = req.RazorpayPaymentID
	order.RazorpaySignature = req.RazorpaySignature
	config.DB.Save(&order)

	// Partner Protocol Reward Settlement
	ProcessPartnerRewards(order)

	// Automated Membership Entitlement logic
	var isMembershipOrder bool
	for _, item := range order.OrderItems {
		var product models.Product
		if err := config.DB.First(&product, item.ProductID).Error; err == nil {
			if product.Category == "Membership" {
				isMembershipOrder = true
				break
			}
		}
	}

	if isMembershipOrder {
		var user models.User
		if err := config.DB.First(&user, order.UserID).Error; err == nil {
			now := time.Now()
			oneYear := time.Hour * 24 * 365
			
			var newExpiry time.Time
			if user.IsPro && user.ProExpiresAt != nil && user.ProExpiresAt.After(now) {
				// Extend existing subscription
				newExpiry = user.ProExpiresAt.Add(oneYear)
			} else {
				// Start new subscription
				newExpiry = now.Add(oneYear)
			}
			
			user.IsPro = true
			user.ProExpiresAt = &newExpiry
			user.SubscriptionPlan = "pro"
			config.DB.Save(&user)
			fmt.Printf("Subscription Entitlement: User %d is now Pro until %v\n", user.ID, newExpiry)
		}
	}

	if err := issueMissingLicensesForOrder(order.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to issue license keys")
		return
	}
	order.Entitled = computeOrderEntitled(order)

	c.JSON(http.StatusOK, gin.H{
		"status":        "captured",
		"paymentStatus": order.PaymentStatus,
		"entitled":      order.Entitled,
		"orderId":       order.ID,
		"message":       "Payment verified securely!",
	})
}

func RazorpayWebhook(c *gin.Context) {
	secret := os.Getenv("RAZORPAY_WEBHOOK_SECRET")
	signature := c.GetHeader("X-Razorpay-Signature")

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Cannot read body")
		return
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(bodyBytes)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if expectedSignature != signature {
		respondError(c, http.StatusForbidden, "Invalid webhook signature")
		return
	}

	var payload struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					OrderID string `json:"order_id"`
					ID      string `json:"id"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}

	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid JSON mapping")
		return
	}

	orderID := payload.Payload.Payment.Entity.OrderID

	switch payload.Event {
		case "payment.captured", "order.paid":
			var order models.Order
			if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
				order.PaymentStatus = "paid"
				order.Status = "paid"
				order.RazorpayPaymentID = payload.Payload.Payment.Entity.ID
				config.DB.Save(&order)
				_ = issueMissingLicensesForOrder(order.ID)
				ProcessPartnerRewards(order)
			}
	case "payment.failed":
		var order models.Order
		if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
			order.PaymentStatus = "failed"
			order.Status = "failed"
			config.DB.Save(&order)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func ProcessPartnerRewards(order models.Order) {
	var user models.User
	if err := config.DB.First(&user, order.UserID).Error; err != nil {
		return
	}

	// Only reward if the user was referred by someone
	if user.ReferrerID != nil && *user.ReferrerID != 0 {
		var referrer models.User
		if err := config.DB.First(&referrer, *user.ReferrerID).Error; err == nil {
			// Reward logic: ₹100 credit per purchase
			rewardAmount := 100.0
			referrer.PartnerBalance += rewardAmount
			config.DB.Save(&referrer)
			fmt.Printf("Partner Protocol: Credited ₹%.2f to Referrer ID %d for order %d\n", rewardAmount, referrer.ID, order.ID)
		}
	}
}
