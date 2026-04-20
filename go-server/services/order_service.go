package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrOrderNotFound       = errors.New("order not found")
	ErrInvalidOrderItems   = errors.New("order must include at least one valid item")
	ErrCouponInvalid       = errors.New("invalid or expired coupon")
	ErrCouponUsageExceeded = errors.New("coupon usage limit reached")
)

type DraftOrderItemInput struct {
	ProductID uint
	Quantity  int
}

type DraftOrderInput struct {
	UserID     uint
	Items      []DraftOrderItemInput
	CouponCode string
	Currency   string
	RequestID  string
}

type SettleOrderInput struct {
	RazorpayOrderID   string
	RazorpayPaymentID string
	RazorpaySignature string
	Source            string
	RequestID         string
}

type SettleOrderResult struct {
	Order          models.Order
	AlreadySettled bool
	LicensesIssued int
	RewardCredited bool
}

type pricedOrder struct {
	items          []models.OrderItem
	subtotal       float64
	discount       float64
	total          float64
	coupon         *models.Coupon
	couponReserved bool
}

func CreateDraftOrder(ctx context.Context, input DraftOrderInput) (*models.Order, error) {
	if input.UserID == 0 {
		return nil, ErrInvalidOrderItems
	}

	currency := strings.ToUpper(strings.TrimSpace(input.Currency))
	if currency == "" {
		currency = "INR"
	}

	var order models.Order
	err := config.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		priced, err := priceOrder(tx, input.Items, input.CouponCode, true)
		if err != nil {
			return err
		}

		order = models.Order{
			UserID:            input.UserID,
			SubtotalPrice:     priced.subtotal,
			DiscountAmount:    priced.discount,
			TotalPrice:        priced.total,
			Currency:          currency,
			Status:            string(models.OrderStatusPending),
			PaymentStatus:     string(models.PaymentStatusPending),
			EntitlementStatus: string(models.EntitlementAuto),
			CouponCode:        models.NormalizeCouponCode(input.CouponCode),
			CouponReserved:    priced.couponReserved,
			OrderItems:        priced.items,
		}
		if priced.coupon != nil {
			order.CouponID = &priced.coupon.ID
			order.CouponCode = priced.coupon.Code
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		orderID := order.ID
		WriteAuditLog(tx, AuditEvent{
			RequestID:    input.RequestID,
			ActorUserID:  &input.UserID,
			EventType:    "order.draft_created",
			ResourceType: "order",
			ResourceID:   &orderID,
			Message:      "Draft order created for payment initialization",
			Metadata: map[string]interface{}{
				"subtotalPrice":  order.SubtotalPrice,
				"discountAmount": order.DiscountAmount,
				"totalPrice":     order.TotalPrice,
				"currency":       order.Currency,
				"couponCode":     order.CouponCode,
			},
		})

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &order, nil
}

func AttachRazorpayOrderID(ctx context.Context, orderID uint, razorpayOrderID string, requestID string) error {
	return config.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			return err
		}

		order.RazorpayOrderID = strings.TrimSpace(razorpayOrderID)
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		actorID := order.UserID
		resourceID := order.ID
		WriteAuditLog(tx, AuditEvent{
			RequestID:    requestID,
			ActorUserID:  &actorID,
			EventType:    "payment.gateway_order_created",
			ResourceType: "order",
			ResourceID:   &resourceID,
			Message:      "Razorpay order created for draft order",
			Metadata: map[string]interface{}{
				"razorpayOrderId": razorpayOrderID,
			},
		})
		return nil
	})
}

func MarkOrderPaymentCreationFailed(ctx context.Context, orderID uint, requestID string, reason string) error {
	return config.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			return err
		}

		if err := releaseCouponReservation(tx, &order); err != nil {
			return err
		}

		order.Status = string(models.OrderStatusFailed)
		order.PaymentStatus = string(models.PaymentStatusFailed)
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		actorID := order.UserID
		resourceID := order.ID
		WriteAuditLog(tx, AuditEvent{
			RequestID:    requestID,
			ActorUserID:  &actorID,
			EventType:    "payment.gateway_order_failed",
			ResourceType: "order",
			ResourceID:   &resourceID,
			Severity:     "warn",
			Message:      "Payment gateway order creation failed",
			Metadata: map[string]interface{}{
				"reason": reason,
			},
		})
		return nil
	})
}

func MarkPaymentFailedByRazorpayOrder(ctx context.Context, razorpayOrderID string, razorpayPaymentID string, source string, requestID string) error {
	return config.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("razorpay_order_id = ?", strings.TrimSpace(razorpayOrderID)).First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderNotFound
			}
			return err
		}

		if strings.EqualFold(order.PaymentStatus, string(models.PaymentStatusPaid)) || strings.EqualFold(order.Status, string(models.OrderStatusPaid)) {
			return nil
		}
		if strings.EqualFold(order.PaymentStatus, string(models.PaymentStatusFailed)) && !order.CouponReserved {
			return nil
		}

		if err := releaseCouponReservation(tx, &order); err != nil {
			return err
		}

		order.PaymentStatus = string(models.PaymentStatusFailed)
		order.Status = string(models.OrderStatusFailed)
		if strings.TrimSpace(razorpayPaymentID) != "" {
			order.RazorpayPaymentID = strings.TrimSpace(razorpayPaymentID)
		}
		order.SettlementSource = strings.TrimSpace(source)
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		actorID := order.UserID
		resourceID := order.ID
		WriteAuditLog(tx, AuditEvent{
			RequestID:    requestID,
			ActorUserID:  &actorID,
			EventType:    "payment.failed",
			ResourceType: "order",
			ResourceID:   &resourceID,
			Severity:     "warn",
			Message:      "Order marked failed after payment failure notification",
			Metadata: map[string]interface{}{
				"source":            source,
				"razorpayOrderId":   order.RazorpayOrderID,
				"razorpayPaymentId": order.RazorpayPaymentID,
			},
		})
		return nil
	})
}

func FinalizePaidOrder(ctx context.Context, input SettleOrderInput) (*SettleOrderResult, error) {
	result := &SettleOrderResult{}

	err := config.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Preload("OrderItems").
			Where("razorpay_order_id = ?", strings.TrimSpace(input.RazorpayOrderID)).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderNotFound
			}
			return err
		}

		orderID := order.ID
		alreadySettled := strings.EqualFold(order.PaymentStatus, string(models.PaymentStatusPaid)) || strings.EqualFold(order.Status, string(models.OrderStatusPaid))
		if alreadySettled {
			result.AlreadySettled = true
		} else {
			now := time.Now()
			order.Status = string(models.OrderStatusPaid)
			order.PaymentStatus = string(models.PaymentStatusPaid)
			order.RazorpayPaymentID = strings.TrimSpace(input.RazorpayPaymentID)
			order.RazorpaySignature = strings.TrimSpace(input.RazorpaySignature)
			order.SettledAt = &now
			order.PaymentCapturedAt = &now
			order.SettlementSource = strings.TrimSpace(input.Source)
			order.CouponReserved = false
			if err := tx.Save(&order).Error; err != nil {
				return err
			}

			WriteAuditLog(tx, AuditEvent{
				RequestID:    input.RequestID,
				ActorUserID:  &order.UserID,
				EventType:    "payment.settled",
				ResourceType: "order",
				ResourceID:   &orderID,
				Message:      "Order settled successfully",
				Metadata: map[string]interface{}{
					"source":            input.Source,
					"razorpayOrderId":   order.RazorpayOrderID,
					"razorpayPaymentId": order.RazorpayPaymentID,
					"totalPrice":        order.TotalPrice,
					"currency":          order.Currency,
				},
			})
		}

		rewardCredited, err := ensurePartnerReward(tx, &order, input.RequestID)
		if err != nil {
			return err
		}
		result.RewardCredited = rewardCredited

		if err := ensureMembershipAccess(tx, &order, input.RequestID); err != nil {
			return err
		}

		if err := ensureEliteSupportAccess(tx, &order); err != nil {
			return err
		}

		issuedCount, err := EnsureOrderLicenses(tx, &order, input.RequestID)
		if err != nil {
			return err
		}
		result.LicensesIssued = issuedCount

		// Award purchase XP
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, order.UserID).Error; err == nil {
			AwardXP(&user, XPPurchase)
			tx.Save(&user)
		}

		order.Entitled = true
		result.Order = order
		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

func priceOrder(tx *gorm.DB, items []DraftOrderItemInput, couponCode string, reserveCoupon bool) (*pricedOrder, error) {
	normalized := make(map[uint]int)
	for _, item := range items {
		if item.ProductID == 0 || item.Quantity <= 0 {
			continue
		}
		normalized[item.ProductID] += item.Quantity
	}
	if len(normalized) == 0 {
		return nil, ErrInvalidOrderItems
	}

	productIDs := make([]uint, 0, len(normalized))
	for productID := range normalized {
		productIDs = append(productIDs, productID)
	}

	var products []models.Product
	if err := tx.Where("id IN ?", productIDs).Find(&products).Error; err != nil {
		return nil, err
	}
	if len(products) != len(productIDs) {
		return nil, ErrInvalidOrderItems
	}

	productsByID := make(map[uint]models.Product, len(products))
	for _, product := range products {
		if product.ModerationStatus != models.ModStatusApproved || strings.Contains(strings.ToLower(product.StatusFlags), "archived") {
			return nil, fmt.Errorf("product %d is not available for purchase", product.ID)
		}
		productsByID[product.ID] = product
	}

	priced := &pricedOrder{
		items: make([]models.OrderItem, 0, len(normalized)),
	}
	for productID, quantity := range normalized {
		product := productsByID[productID]
		lineTotal := roundCurrency(product.Price * float64(quantity))
		priced.subtotal = roundCurrency(priced.subtotal + lineTotal)
		priced.items = append(priced.items, models.OrderItem{
			ProductID: product.ID,
			Quantity:  quantity,
			Price:     roundCurrency(product.Price),
		})
	}

	normalizedCouponCode := models.NormalizeCouponCode(couponCode)
	if normalizedCouponCode != "" {
		var coupon models.Coupon
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("UPPER(code) = ? AND active = ?", normalizedCouponCode, true).
			First(&coupon).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrCouponInvalid
			}
			return nil, err
		}
		if !coupon.IsValid(priced.subtotal, "all") {
			if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
				return nil, ErrCouponUsageExceeded
			}
			return nil, ErrCouponInvalid
		}

		priced.coupon = &coupon
		priced.discount = roundCurrency(coupon.CalculateDiscount(priced.subtotal))
		if reserveCoupon {
			coupon.UsedCount++
			if err := tx.Save(&coupon).Error; err != nil {
				return nil, err
			}
			priced.couponReserved = true
		}
	}

	priced.total = roundCurrency(priced.subtotal - priced.discount)
	if priced.total < 0 {
		priced.total = 0
	}

	return priced, nil
}

func releaseCouponReservation(tx *gorm.DB, order *models.Order) error {
	if tx == nil || order == nil || !order.CouponReserved || order.CouponID == nil {
		return nil
	}

	var coupon models.Coupon
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&coupon, *order.CouponID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			order.CouponReserved = false
			return nil
		}
		return err
	}

	if coupon.UsedCount > 0 {
		coupon.UsedCount--
		if err := tx.Save(&coupon).Error; err != nil {
			return err
		}
	}
	order.CouponReserved = false
	return nil
}

func ensureMembershipAccess(tx *gorm.DB, order *models.Order, requestID string) error {
	if tx == nil || order == nil {
		return nil
	}

	if len(order.OrderItems) == 0 {
		if err := tx.Preload("OrderItems").First(order, order.ID).Error; err != nil {
			return err
		}
	}

	var extension time.Duration
	for _, item := range order.OrderItems {
		var product models.Product
		if err := tx.Select("id", "type", "duration").First(&product, item.ProductID).Error; err != nil {
			return err
		}
		if product.Type == models.ProductTypeSubscription {
			extension += resolveMembershipDuration(product)
		}
	}
	if extension <= 0 {
		return nil
	}

	var user models.User
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, order.UserID).Error; err != nil {
		return err
	}

	now := time.Now()
	startAt := now
	if user.ProExpiresAt != nil && user.ProExpiresAt.After(now) {
		startAt = *user.ProExpiresAt
	}
	newExpiry := startAt.Add(extension)
	user.IsPro = true
	user.SubscriptionPlan = "pro"
	user.ProExpiresAt = &newExpiry

	if err := tx.Save(&user).Error; err != nil {
		return err
	}

	resourceID := user.ID
	WriteAuditLog(tx, AuditEvent{
		RequestID:    requestID,
		ActorUserID:  &user.ID,
		EventType:    "membership.granted",
		ResourceType: "user",
		ResourceID:   &resourceID,
		Message:      "Membership entitlement granted or extended",
		Metadata: map[string]interface{}{
			"orderId":      order.ID,
			"newExpiry":    newExpiry.UTC().Format(time.RFC3339),
			"durationDays": int(extension.Hours() / 24),
		},
	})

	return nil
}

func ensurePartnerReward(tx *gorm.DB, order *models.Order, requestID string) (bool, error) {
	if tx == nil || order == nil || order.PartnerRewardSettled {
		return false, nil
	}

	var user models.User
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, order.UserID).Error; err != nil {
		return false, err
	}
	if user.ReferrerID == nil || *user.ReferrerID == 0 {
		return false, nil
	}

	var referrer models.User
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&referrer, *user.ReferrerID).Error; err != nil {
		return false, err
	}

	rewardAmount := roundCurrency(100)
	referrer.PartnerBalance = roundCurrency(referrer.PartnerBalance + rewardAmount)
	if err := tx.Save(&referrer).Error; err != nil {
		return false, err
	}

	order.PartnerRewardSettled = true
	order.PartnerRewardAmount = rewardAmount
	if err := tx.Save(order).Error; err != nil {
		return false, err
	}

	referrerID := referrer.ID
	orderID := order.ID
	WriteAuditLog(tx, AuditEvent{
		RequestID:    requestID,
		ActorUserID:  &user.ID,
		EventType:    "partner.reward_credited",
		ResourceType: "order",
		ResourceID:   &orderID,
		Message:      "Referrer reward credited after successful settlement",
		Metadata: map[string]interface{}{
			"referrerId":   referrerID,
			"rewardAmount": rewardAmount,
		},
	})

	return true, nil
}

func ensureEliteSupportAccess(tx *gorm.DB, order *models.Order) error {
	if tx == nil || order == nil {
		return nil
	}

	// For every product that is NOT a membership, grant 30 days of support chat
	for _, item := range order.OrderItems {
		var product models.Product
		if err := tx.First(&product, item.ProductID).Error; err != nil {
			continue
		}

		if product.Type != models.ProductTypeSubscription {
			// Check if a session already exists for this user+product from this order
			var count int64
			tx.Model(&models.EliteChatSession{}).
				Where("user_id = ? AND product_id = ? AND payment_id = ?", order.UserID, product.ID, order.ID).
				Count(&count)
			if count > 0 {
				continue // Already created
			}

			orderID := order.ID
			session := models.EliteChatSession{
				UserID:    order.UserID,
				ProductID: product.ID,
				Title:     "Purchase Support: " + product.Title,
				Status:    "active",
				Source:    "purchase",
				PaymentID: &orderID,
				ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
			}
			if err := tx.Create(&session).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func resolveMembershipDuration(product models.Product) time.Duration {
	duration := strings.ToLower(strings.TrimSpace(product.Duration))
	switch duration {
	case "year", "yearly", "annual", "annually":
		return 365 * 24 * time.Hour
	case "quarter", "quarterly":
		return 90 * 24 * time.Hour
	default:
		return 30 * 24 * time.Hour
	}
}

func roundCurrency(value float64) float64 {
	return float64(int64(value*100+0.5)) / 100
}

func LogServiceError(event string, err error, attrs ...any) {
	args := make([]any, 0, len(attrs)+2)
	args = append(args, "event", event)
	if err != nil {
		args = append(args, "error", err.Error())
	}
	args = append(args, attrs...)
	slog.Default().Error("service_error", args...)
}
