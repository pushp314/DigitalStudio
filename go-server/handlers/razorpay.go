package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
	razorpay "github.com/razorpay/razorpay-go"
)

type CreatePaymentOrderReq struct {
	Items      []OrderItemReq `json:"items" binding:"required,min=1"`
	CouponCode           string         `json:"couponCode"`
	AddDeploymentService bool           `json:"addDeploymentService"`
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

	keyID := config.AppConfig.RazorpayKeyID
	keySecret := config.AppConfig.RazorpayKeySecret
	if keyID == "" || keySecret == "" {
		respondError(c, http.StatusInternalServerError, "Razorpay credentials are not configured")
		return
	}

	items := make([]services.DraftOrderItemInput, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, services.DraftOrderItemInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		})
	}

	order, err := services.CreateDraftOrder(c.Request.Context(), services.DraftOrderInput{
		UserID:               userID.(uint),
		Items:                items,
		CouponCode:           req.CouponCode,
		AddDeploymentService: req.AddDeploymentService,
		Currency:             "INR",
		RequestID:            requestIDFromContext(c),
	})
	if err != nil {
		switch err {
		case services.ErrInvalidOrderItems, services.ErrCouponInvalid, services.ErrCouponUsageExceeded:
			respondError(c, http.StatusBadRequest, err.Error())
		default:
			respondError(c, http.StatusInternalServerError, "Failed to create local order")
		}
		return
	}

	client := razorpay.NewClient(keyID, keySecret)
	amountPaise := int64(order.TotalPrice * 100)
	data := map[string]interface{}{
		"amount":          amountPaise,
		"currency":        order.Currency,
		"receipt":         fmt.Sprintf("receipt_order_%d", order.ID),
		"payment_capture": 1,
	}

	razorpayOrder, err := client.Order.Create(data, nil)
	if err != nil {
		_ = services.MarkOrderPaymentCreationFailed(c.Request.Context(), order.ID, requestIDFromContext(c), err.Error())
		respondError(c, http.StatusInternalServerError, "Failed to generate Razorpay order")
		return
	}

	razorpayOrderID, _ := razorpayOrder["id"].(string)
	if err := services.AttachRazorpayOrderID(c.Request.Context(), order.ID, razorpayOrderID, requestIDFromContext(c)); err != nil {
		_ = services.MarkOrderPaymentCreationFailed(c.Request.Context(), order.ID, requestIDFromContext(c), err.Error())
		respondError(c, http.StatusInternalServerError, "Failed to persist payment order")
		return
	}

	order.RazorpayOrderID = razorpayOrderID
	c.JSON(http.StatusOK, gin.H{
		"localOrderId":  order.ID,
		"orderId":       order.RazorpayOrderID,
		"amount":        amountPaise,
		"currency":      order.Currency,
		"keyId":         keyID,
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

	var order models.Order
	if err := config.DB.Where("razorpay_order_id = ?", strings.TrimSpace(req.RazorpayOrderID)).First(&order).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}
	if order.UserID != userID.(uint) {
		respondError(c, http.StatusForbidden, "You are not allowed to verify this order")
		return
	}

	secret := config.AppConfig.RazorpayKeySecret
	if !verifyRazorpaySignature(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature, secret) {
		respondError(c, http.StatusForbidden, "Invalid payment signature")
		return
	}

	if !strings.EqualFold(order.PaymentStatus, string(models.PaymentStatusPaid)) && !strings.EqualFold(order.Status, string(models.OrderStatusPaid)) {
		keyID := config.AppConfig.RazorpayKeyID
		client := razorpay.NewClient(keyID, secret)
		paymentData, err := client.Payment.Fetch(req.RazorpayPaymentID, nil, nil)
		if err != nil {
			respondError(c, http.StatusBadRequest, "Failed to fetch payment status")
			return
		}

		status, _ := paymentData["status"].(string)
		if !strings.EqualFold(status, "captured") {
			respondError(c, http.StatusBadRequest, "Payment not explicitly captured")
			return
		}
	}

	result, err := services.FinalizePaidOrder(c.Request.Context(), services.SettleOrderInput{
		RazorpayOrderID:   req.RazorpayOrderID,
		RazorpayPaymentID: req.RazorpayPaymentID,
		RazorpaySignature: req.RazorpaySignature,
		Source:            "verify",
		RequestID:         requestIDFromContext(c),
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to finalize order settlement")
		return
	}

	message := "Payment verified securely!"
	if result.AlreadySettled {
		message = "Payment already settled"
	}
	c.JSON(http.StatusOK, gin.H{
		"status":         "captured",
		"paymentStatus":  result.Order.PaymentStatus,
		"entitled":       computeOrderEntitled(result.Order),
		"orderId":        result.Order.ID,
		"alreadySettled": result.AlreadySettled,
		"message":        message,
	})
}

func RazorpayWebhook(c *gin.Context) {
	secret := config.AppConfig.RazorpayWebhookSecret
	signature := strings.TrimSpace(c.GetHeader("X-Razorpay-Signature"))
	if secret == "" || signature == "" {
		respondError(c, http.StatusForbidden, "Invalid webhook signature")
		return
	}

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Cannot read body")
		return
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(bodyBytes)
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	if !hmac.Equal([]byte(expectedSignature), []byte(signature)) {
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

	orderID := strings.TrimSpace(payload.Payload.Payment.Entity.OrderID)
	paymentID := strings.TrimSpace(payload.Payload.Payment.Entity.ID)
	requestID := requestIDFromContext(c)

	switch payload.Event {
	case "payment.captured", "order.paid":
		if orderID != "" {
			_, err := services.FinalizePaidOrder(c.Request.Context(), services.SettleOrderInput{
				RazorpayOrderID:   orderID,
				RazorpayPaymentID: paymentID,
				Source:            "webhook",
				RequestID:         requestID,
			})
			if err != nil && !errors.Is(err, services.ErrOrderNotFound) {
				respondError(c, http.StatusInternalServerError, "Failed to finalize webhook payment")
				return
			}
		}
	case "payment.failed":
		if orderID != "" {
			err := services.MarkPaymentFailedByRazorpayOrder(c.Request.Context(), orderID, paymentID, "webhook", requestID)
			if err != nil && !errors.Is(err, services.ErrOrderNotFound) {
				respondError(c, http.StatusInternalServerError, "Failed to process failed payment")
				return
			}
		}

	case "refund.created", "payment.refunded":
		// Handle refund: suspend licenses and reverse affiliate commissions
		if orderID != "" {
			var order models.Order
			if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
				// Suspend all licenses for this order
				_ = services.SuspendLicensesByOrder(config.DB, order.ID, "Refund processed via webhook", nil)

				// Reverse affiliate commissions for this order
				config.DB.Model(&models.AffiliateConversion{}).
					Where("order_id = ? AND commission_status = ?", order.ID, "pending").
					Update("commission_status", "reversed")

				// Log the refund event
				services.WriteAuditLog(config.DB, services.AuditEvent{
					RequestID:    requestID,
					EventType:    "payment.refunded",
					ResourceType: "order",
					ResourceID:   &order.ID,
					Message:      "Refund webhook processed: licenses suspended, commissions reversed",
					Metadata: map[string]interface{}{
						"razorpayOrderId":   orderID,
						"razorpayPaymentId": paymentID,
						"event":             payload.Event,
					},
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func verifyRazorpaySignature(orderID string, paymentID string, signature string, secret string) bool {
	if strings.TrimSpace(secret) == "" {
		return false
	}

	data := strings.TrimSpace(orderID) + "|" + strings.TrimSpace(paymentID)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expectedSignature), []byte(strings.TrimSpace(signature)))
}
