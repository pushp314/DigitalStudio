package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pushp314/digitalstudio/go-server/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func GenerateLicenseKey(userID uint, orderID uint, productID uint) string {
	return fmt.Sprintf("DS-%d-%d-%d-%s", userID, orderID, productID, strings.ToUpper(uuid.New().String()[:8]))
}

func EnsureOrderLicenses(tx *gorm.DB, order *models.Order, requestID string) (int, error) {
	if tx == nil || order == nil {
		return 0, nil
	}

	if len(order.OrderItems) == 0 {
		if err := tx.Preload("OrderItems").First(order, order.ID).Error; err != nil {
			return 0, err
		}
	}

	issuedCount := 0
	for _, item := range order.OrderItems {
		var product models.Product
		if err := tx.Select("id", "type").First(&product, item.ProductID).Error; err != nil {
			return issuedCount, err
		}
		if product.Type == models.ProductTypeSubscription {
			continue
		}

		license := models.License{
			UserID:     order.UserID,
			ProductID:  item.ProductID,
			OrderID:    order.ID,
			Type:       models.LicensePersonal,
			LicenseKey: GenerateLicenseKey(order.UserID, order.ID, item.ProductID),
			Status:     string(models.LicenseStatusActive),
			ExpiryDate: nil,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		result := tx.Clauses(clause.OnConflict{
			Columns: []clause.Column{
				{Name: "user_id"},
				{Name: "product_id"},
				{Name: "order_id"},
			},
			DoNothing: true,
		}).Create(&license)
		if result.Error != nil {
			return issuedCount, result.Error
		}
		if result.RowsAffected > 0 {
			issuedCount++
			orderID := order.ID
			productID := item.ProductID
			WriteAuditLog(tx, AuditEvent{
				RequestID:    requestID,
				ActorUserID:  &order.UserID,
				EventType:    "license.issued",
				ResourceType: "license",
				ResourceID:   nil,
				Message:      "License issued for settled order",
				Metadata: map[string]interface{}{
					"orderId":   orderID,
					"productId": productID,
					"userId":    order.UserID,
				},
			})
		}
	}

	return issuedCount, nil
}
