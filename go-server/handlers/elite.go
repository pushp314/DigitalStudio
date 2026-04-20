package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/middleware"
	"github.com/pushp314/digitalstudio/go-server/models"
	razorpay "github.com/razorpay/razorpay-go"
)

func RegisterEliteRoutes(r *gin.RouterGroup) {
	elite := r.Group("/support", middleware.AuthMiddleware())
	{
		// Payment flow
		elite.POST("/create-order/:productId", CreateNegotiationOrder)
		elite.POST("/verify-payment", VerifyNegotiationPayment)

		// Chat
		elite.GET("/sessions", GetEliteSessions)
		elite.GET("/sessions/:id/messages", GetEliteMessages)
		elite.POST("/sessions/:id/messages", SendEliteMessage)
		elite.PATCH("/sessions/:id/read", MarkEliteMessagesRead)

		// Admin management
		elite.PATCH("/sessions/:id/close", middleware.AdminMiddleware(), CloseEliteSession)
		elite.PATCH("/sessions/:id/resolve", middleware.AdminMiddleware(), ResolveEliteSession)
		elite.PATCH("/sessions/:id/extend", middleware.AdminMiddleware(), ExtendEliteSession)
	}
}

// CreateNegotiationOrder creates a Razorpay order for the ₹9 negotiation fee.
// If the user already has an active session for this product, returns it instead.
func CreateNegotiationOrder(c *gin.Context) {
	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Please log in to continue")
		return
	}
	userID := val.(uint)
	productIDStr := c.Param("productId")
	parsedID, _ := strconv.ParseUint(productIDStr, 10, 64)
	productID := uint(parsedID)

	// 1. Check if user is Pro (Membership gives free support)
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Identity not found")
		return
	}

	isPro := user.SubscriptionPlan == "pro" || user.Role == models.RoleAdmin

	// 2. Check for existing active session
	var existing models.EliteChatSession
	query := config.DB.Where("user_id = ? AND status = 'active' AND expires_at > ?", userID, time.Now())
	if productID > 0 {
		query = query.Where("product_id = ?", productID)
	} else {
		query = query.Where("product_id = 0")
	}
	if err := query.First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"alreadyActive": true,
			"sessionId":     existing.ID,
			"message":       "You already have an active chat session",
		})
		return
	}

	// 3. Pro Bypass: If Pro, create session immediately for free
	if isPro {
		title := "Priority Expert Support"
		if productID > 0 {
			var product models.Product
			if err := config.DB.First(&product, productID).Error; err == nil {
				title = "Expert Negotiation: " + product.Title
			}
		}

		session := models.EliteChatSession{
			UserID:    userID,
			ProductID: productID,
			Title:     title,
			Status:    "active",
			Source:    "pro_benefit",
			ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
		}

		if err := config.DB.Create(&session).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "Failed to instantiate free support node")
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"isFree":     true,
			"sessionId":  session.ID,
			"message":    "Pro Membership Benefit: Opening priority support workspace.",
		})
		return
	}

	// 4. Non-Pro flow: Get negotiation fee and validate optional Coupon
	var siteConfig models.SiteConfig
	config.DB.First(&siteConfig)
	fee := siteConfig.EliteSettings.NegotiationFee
	if fee <= 0 {
		fee = 9 // Default ₹9
	}

	var req struct {
		CouponCode string `json:"couponCode"`
	}
	c.ShouldBindJSON(&req)

	discount := 0.0
	if req.CouponCode != "" {
		var coupon models.Coupon
		if err := config.DB.Where("code = ? AND active = ?", models.NormalizeCouponCode(req.CouponCode), true).First(&coupon).Error; err == nil {
			if coupon.IsValid(fee, "support") {
				discount = coupon.CalculateDiscount(fee)
			}
		}
	}

	finalPrice := fee - discount
	if finalPrice < 0 {
		finalPrice = 0
	}

	keyID := strings.TrimSpace(os.Getenv("RAZORPAY_KEY_ID"))
	keySecret := strings.TrimSpace(os.Getenv("RAZORPAY_KEY_SECRET"))
	if keyID == "" || keySecret == "" {
		respondError(c, http.StatusInternalServerError, "Payment system is not configured")
		return
	}

	// Create a lightweight internal order record
	order := models.Order{
		UserID:        userID,
		TotalPrice:    finalPrice,
		SubtotalPrice: fee,
		CouponCode:    req.CouponCode,
		Currency:      "INR",
		Status:        string(models.OrderStatusPending),
		PaymentStatus: string(models.PaymentStatusPending),
	}
	if err := config.DB.Create(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create payment order")
		return
	}

	// Check if finalPrice is zero (Free with coupon)
	if finalPrice <= 0 {
		// Create session directly
		now := time.Now()
		config.DB.Model(&order).Updates(map[string]interface{}{
			"status":         "paid",
			"payment_status": "paid",
			"settled_at":     now,
		})

		title := "General Support"
		if productID > 0 {
			var product models.Product
			if err := config.DB.First(&product, productID).Error; err == nil {
				title = "Negotiation: " + product.Title
			}
		}
		
		session := models.EliteChatSession{
			UserID:    userID,
			ProductID: productID,
			Title:     title,
			Status:    "active",
			Source:    "negotiation_coupon",
			PaymentID: &order.ID,
			ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
		}
		config.DB.Create(&session)

		c.JSON(http.StatusCreated, gin.H{
			"isFree":     true,
			"sessionId":  session.ID,
			"message":    "Coupon Applied: Access granted for free.",
		})
		return
	}

	// Create Razorpay order
	client := razorpay.NewClient(keyID, keySecret)
	amountPaise := int64(finalPrice * 100)
	data := map[string]interface{}{
		"amount":          amountPaise,
		"currency":        "INR",
		"receipt":         fmt.Sprintf("negotiate_order_%d", order.ID),
		"payment_capture": 1,
		"notes": map[string]interface{}{
			"type":      "negotiation",
			"productId": productID,
			"userId":    userID,
		},
	}

	razorpayOrder, err := client.Order.Create(data, nil)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create payment order with Razorpay")
		return
	}

	razorpayOrderID, _ := razorpayOrder["id"].(string)
	config.DB.Model(&order).Updates(map[string]interface{}{
		"razorpay_order_id": razorpayOrderID,
	})

	c.JSON(http.StatusOK, gin.H{
		"localOrderId": order.ID,
		"orderId":      razorpayOrderID,
		"amount":       amountPaise,
		"currency":     "INR",
		"keyId":        keyID,
		"productId":    productID,
	})
}

// VerifyNegotiationPayment verifies Razorpay payment and creates the chat session
func VerifyNegotiationPayment(c *gin.Context) {
	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Please log in to continue")
		return
	}
	userID := val.(uint)

	var req struct {
		RazorpayOrderID   string `json:"razorpayOrderId" binding:"required"`
		RazorpayPaymentID string `json:"razorpayPaymentId" binding:"required"`
		RazorpaySignature string `json:"razorpaySignature" binding:"required"`
		ProductID         uint   `json:"productId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Missing payment details")
		return
	}

	// Find the order
	var order models.Order
	if err := config.DB.Where("razorpay_order_id = ?", strings.TrimSpace(req.RazorpayOrderID)).First(&order).Error; err != nil {
		respondError(c, http.StatusNotFound, "Payment order not found")
		return
	}
	if order.UserID != userID {
		respondError(c, http.StatusForbidden, "This payment does not belong to you")
		return
	}

	// Check if already settled (idempotency)
	if strings.EqualFold(order.PaymentStatus, string(models.PaymentStatusPaid)) {
		// Find the session created from this order
		var existingSession models.EliteChatSession
		if err := config.DB.Where("payment_id = ?", order.ID).First(&existingSession).Error; err == nil {
			c.JSON(http.StatusOK, gin.H{
				"alreadySettled": true,
				"sessionId":     existingSession.ID,
				"message":       "Payment already verified",
			})
			return
		}
	}

	// Verify Razorpay signature
	secret := strings.TrimSpace(os.Getenv("RAZORPAY_KEY_SECRET"))
	if !verifyRazorpaySignature(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature, secret) {
		respondError(c, http.StatusForbidden, "Payment verification failed — invalid signature")
		return
	}

	// Mark order as paid
	now := time.Now()
	config.DB.Model(&order).Updates(map[string]interface{}{
		"status":                "paid",
		"payment_status":        "paid",
		"razorpay_payment_id":   strings.TrimSpace(req.RazorpayPaymentID),
		"razorpay_signature":    strings.TrimSpace(req.RazorpaySignature),
		"settled_at":            now,
		"payment_captured_at":   now,
		"settlement_source":     "elite_verify",
	})

	// Get duration from config
	var siteConfig models.SiteConfig
	config.DB.First(&siteConfig)
	days := siteConfig.EliteSettings.ServiceBenefitDays
	if days <= 0 {
		days = 30
	}

	// Build session title
	title := "General Support"
	productID := req.ProductID
	if productID > 0 {
		var product models.Product
		if err := config.DB.First(&product, productID).Error; err == nil {
			title = "Negotiation: " + product.Title
		}
	}

	// Check for duplicate active session (race condition safety)
	var existingSession models.EliteChatSession
	dupQuery := config.DB.Where("user_id = ? AND status = 'active' AND expires_at > ?", userID, time.Now())
	if productID > 0 {
		dupQuery = dupQuery.Where("product_id = ?", productID)
	} else {
		dupQuery = dupQuery.Where("product_id = 0")
	}
	if err := dupQuery.First(&existingSession).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"alreadyActive": true,
			"sessionId":     existingSession.ID,
			"message":       "You already have an active chat session",
		})
		return
	}

	// Create chat session
	orderID := order.ID
	session := models.EliteChatSession{
		UserID:    userID,
		ProductID: productID,
		Title:     title,
		Status:    "active",
		Source:    "negotiation",
		PaymentID: &orderID,
		ExpiresAt: time.Now().Add(time.Duration(days) * 24 * time.Hour),
	}

	if err := config.DB.Create(&session).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create chat session")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"sessionId": session.ID,
		"expiresAt": session.ExpiresAt,
		"message":   "Payment verified. Chat access is now active.",
	})
}

func GetEliteSessions(c *gin.Context) {
	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Please log in to continue")
		return
	}
	userID := val.(uint)

	roleVal, _ := c.Get("userRole")
	userRole, _ := roleVal.(models.Role)

	var sessions []models.EliteChatSession
	query := config.DB.Preload("User").Order("updated_at desc")

	if userRole != models.RoleAdmin {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.Find(&sessions).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load chat sessions")
		return
	}

	// Populate counts for each session
	for i := range sessions {
		var total int64
		var unread int64
		config.DB.Model(&models.EliteChatMessage{}).Where("session_id = ?", sessions[i].ID).Count(&total)
		
		// For unread, count messages where sender is NOT the current viewer
		config.DB.Model(&models.EliteChatMessage{}).
			Where("session_id = ? AND is_read = ? AND sender_id != ?", sessions[i].ID, false, userID).
			Count(&unread)
		
		sessions[i].MessageCount = int(total)
		sessions[i].UnreadCount = int(unread)
	}

	c.JSON(http.StatusOK, sessions)
}

// MarkEliteMessagesRead marks all incoming messages in a session as read
func MarkEliteMessagesRead(c *gin.Context) {
	sessionID := c.Param("id")
	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Please log in to continue")
		return
	}
	userID := val.(uint)

	// Update all messages in this session that were NOT sent by this user
	if err := config.DB.Model(&models.EliteChatMessage{}).
		Where("session_id = ? AND sender_id != ? AND is_read = ?", sessionID, userID, false).
		Updates(map[string]interface{}{"is_read": true}).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update read status")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func GetEliteMessages(c *gin.Context) {
	sessionID := c.Param("id")
	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Please log in to continue")
		return
	}
	userID := val.(uint)

	roleVal, _ := c.Get("userRole")
	userRole, _ := roleVal.(models.Role)

	var session models.EliteChatSession
	if err := config.DB.First(&session, sessionID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Chat session not found")
		return
	}

	// Permission check
	if userRole != models.RoleAdmin && session.UserID != userID {
		respondError(c, http.StatusForbidden, "You do not have access to this chat")
		return
	}

	var messages []models.EliteChatMessage
	if err := config.DB.Where("session_id = ?", sessionID).Order("created_at asc").Find(&messages).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load messages")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session":  session,
		"messages": messages,
	})
}

func SendEliteMessage(c *gin.Context) {
	sessionIDStr := c.Param("id")
	sessionID, _ := strconv.ParseUint(sessionIDStr, 10, 64)

	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Please log in to continue")
		return
	}
	userID := val.(uint)

	roleVal, _ := c.Get("userRole")
	userRole, _ := roleVal.(models.Role)

	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Message cannot be empty")
		return
	}

	// Trim and validate message length
	message := strings.TrimSpace(req.Message)
	if message == "" {
		respondError(c, http.StatusBadRequest, "Message cannot be empty")
		return
	}
	if len(message) > 5000 {
		respondError(c, http.StatusBadRequest, "Message is too long (max 5000 characters)")
		return
	}

	var session models.EliteChatSession
	if err := config.DB.First(&session, sessionID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Chat session not found")
		return
	}

	isAdmin := userRole == models.RoleAdmin

	// Permission check
	if !isAdmin && session.UserID != userID {
		respondError(c, http.StatusForbidden, "You are not allowed to send messages here")
		return
	}

	// Expiry / status enforcement (admin can always reply)
	if !isAdmin {
		if session.Status != "active" {
			respondError(c, http.StatusForbidden, "This chat session is "+session.Status+". You cannot send new messages.")
			return
		}
		if time.Now().After(session.ExpiresAt) {
			// Auto-expire the session
			config.DB.Model(&session).Update("status", "expired")
			respondError(c, http.StatusForbidden, "Your chat access has expired. Please renew to continue.")
			return
		}
	}

	msg := models.EliteChatMessage{
		SessionID: uint(sessionID),
		SenderID:  userID,
		Message:   message,
		IsAdmin:   isAdmin,
	}

	if err := config.DB.Create(&msg).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// Update session timestamp for sorting
	config.DB.Model(&session).Update("updated_at", time.Now())

	c.JSON(http.StatusCreated, msg)
}

// CloseEliteSession marks a session as closed (admin only)
func CloseEliteSession(c *gin.Context) {
	sessionID := c.Param("id")

	var session models.EliteChatSession
	if err := config.DB.First(&session, sessionID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Chat session not found")
		return
	}

	config.DB.Model(&session).Update("status", "closed")
	c.JSON(http.StatusOK, gin.H{"message": "Chat session closed", "status": "closed"})
}

// ResolveEliteSession marks a session as resolved (admin only)
func ResolveEliteSession(c *gin.Context) {
	sessionID := c.Param("id")

	var session models.EliteChatSession
	if err := config.DB.First(&session, sessionID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Chat session not found")
		return
	}

	config.DB.Model(&session).Update("status", "resolved")
	c.JSON(http.StatusOK, gin.H{"message": "Chat session marked as resolved", "status": "resolved"})
}

// ExtendEliteSession extends a session's expiry (admin only)
func ExtendEliteSession(c *gin.Context) {
	sessionID := c.Param("id")

	var req struct {
		Days int `json:"days"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Days <= 0 {
		req.Days = 30 // Default 30-day extension
	}

	var session models.EliteChatSession
	if err := config.DB.First(&session, sessionID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Chat session not found")
		return
	}

	// Extend from current expiry or now, whichever is later
	base := session.ExpiresAt
	if time.Now().After(base) {
		base = time.Now()
	}
	newExpiry := base.Add(time.Duration(req.Days) * 24 * time.Hour)

	config.DB.Model(&session).Updates(map[string]interface{}{
		"expires_at": newExpiry,
		"status":     "active",
	})

	c.JSON(http.StatusOK, gin.H{
		"message":   fmt.Sprintf("Access extended by %d days", req.Days),
		"expiresAt": newExpiry,
		"status":    "active",
	})
}
