package handlers

import (
	"strings"

	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
	"gorm.io/gorm"
)

func isPaidOrder(order models.Order) bool {
	return strings.EqualFold(order.PaymentStatus, string(models.PaymentStatusPaid)) || strings.EqualFold(order.Status, string(models.OrderStatusPaid))
}

func computeOrderEntitled(order models.Order) bool {
	switch strings.ToLower(strings.TrimSpace(order.EntitlementStatus)) {
	case string(models.EntitlementGranted):
		return true
	case string(models.EntitlementRevoked):
		return false
	default:
		return isPaidOrder(order)
	}
}

func userHasPaidOrderForProduct(userID uint, productID uint) (bool, error) {
	var count int64
	err := config.DB.
		Table("order_items").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.user_id = ? AND order_items.product_id = ? AND (orders.payment_status = ? OR orders.status = ?)", userID, productID, string(models.PaymentStatusPaid), string(models.OrderStatusPaid)).
		Count(&count).
		Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func hasExistingReview(userID uint, productID uint) (bool, error) {
	var count int64
	if err := config.DB.Model(&models.Review{}).
		Where("user_id = ? AND product_id = ?", userID, productID).
		Count(&count).
		Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func issueMissingLicensesForOrder(orderID uint) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Preload("OrderItems").First(&order, orderID).Error; err != nil {
			return err
		}
		if !isPaidOrder(order) {
			return nil
		}

		_, err := services.EnsureOrderLicenses(tx, &order, "")
		return err
	})
}
