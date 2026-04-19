package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"gorm.io/gorm"
)


func isPaidOrder(order models.Order) bool {
	return strings.EqualFold(order.PaymentStatus, "paid") || strings.EqualFold(order.Status, "paid")
}

func computeOrderEntitled(order models.Order) bool {
	switch strings.ToLower(strings.TrimSpace(order.EntitlementStatus)) {
	case "granted":
		return true
	case "revoked":
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
		Where("orders.user_id = ? AND order_items.product_id = ? AND (orders.payment_status = ? OR orders.status = ?)", userID, productID, "paid", "paid").
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

func generateLicenseKey(userID uint, orderID uint, productID uint) string {
	return fmt.Sprintf("DS-%d-%d-%d-%s", userID, orderID, productID, strings.ToUpper(uuid.New().String()[:8]))
}

func issueMissingLicensesForOrder(orderID uint) error {
	var order models.Order
	if err := config.DB.Preload("OrderItems").First(&order, orderID).Error; err != nil {
		return err
	}
	if !isPaidOrder(order) {
		return nil
	}

	for _, item := range order.OrderItems {
		var product models.Product
		if err := config.DB.First(&product, item.ProductID).Error; err == nil {
			if product.Type == models.ProductTypeSubscription {
				config.DB.Model(&models.User{}).Where("id = ?", order.UserID).Update("subscription_plan", "pro")
				continue
			}
		}

		var existing models.License
		err := config.DB.Where("order_id = ? AND product_id = ? AND user_id = ?", order.ID, item.ProductID, order.UserID).First(&existing).Error
		if err == nil {
			continue
		}
		if err != gorm.ErrRecordNotFound {
			return err
		}

		license := models.License{
			UserID:     order.UserID,
			ProductID:  item.ProductID,
			OrderID:    order.ID,
			Type:       models.LicensePersonal,
			LicenseKey: generateLicenseKey(order.UserID, order.ID, item.ProductID),
			Status:     "active",
			ExpiryDate: nil,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		if err := config.DB.Create(&license).Error; err != nil {
			return err
		}
	}

	return nil
}
