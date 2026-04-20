package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
	"strconv"
)

func AdminListOrders(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	var orders []models.Order
	query := config.DB.
		Preload("User").
		Preload("OrderItems").
		Preload("OrderItems.Product").
		Order("created_at desc")

	switch status {
	case "", "all":
	case "paid":
		query = query.Where("payment_status = ? OR status = ?", "paid", "paid")
	case "pending":
		query = query.Where("payment_status = ? OR status = ?", "pending", "pending")
	case "failed":
		query = query.Where("payment_status = ? OR status = ?", "failed", "failed")
	case "refunded":
		query = query.Where("payment_status = ? OR status = ?", "refunded", "refunded")
	}

	if search != "" {
		query = query.Where("CAST(id AS TEXT) LIKE ? OR customer_email LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Model(&models.Order{}).Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&orders).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}

	for idx := range orders {
		orders[idx].Entitled = computeOrderEntitled(orders[idx])
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.JSON(http.StatusOK, orders)
}

func AdminGetOrder(c *gin.Context) {
	id := c.Param("id")
	var order models.Order
	if err := config.DB.
		Preload("User").
		Preload("OrderItems").
		Preload("OrderItems.Product").
		First(&order, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}

	order.Entitled = computeOrderEntitled(order)
	c.JSON(http.StatusOK, order)
}

func AdminUpdateOrder(c *gin.Context) {
	id := c.Param("id")
	var order models.Order
	if err := config.DB.First(&order, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if status, ok := req["status"].(string); ok {
		status = strings.ToLower(strings.TrimSpace(status))
		switch status {
		case string(models.OrderStatusPending), string(models.OrderStatusFailed), string(models.OrderStatusRefunded), string(models.OrderStatusPaid):
		default:
			respondError(c, http.StatusBadRequest, "Unsupported order status")
			return
		}
		if status == string(models.OrderStatusPaid) && !isPaidOrder(order) {
			respondError(c, http.StatusBadRequest, "Use verified settlement flow to mark an order as paid")
			return
		}
		order.Status = status
	}
	if pstatus, ok := req["paymentStatus"].(string); ok {
		pstatus = strings.ToLower(strings.TrimSpace(pstatus))
		switch pstatus {
		case string(models.PaymentStatusPending), string(models.PaymentStatusFailed), string(models.PaymentStatusRefunded), string(models.PaymentStatusPaid):
		default:
			respondError(c, http.StatusBadRequest, "Unsupported payment status")
			return
		}
		if pstatus == string(models.PaymentStatusPaid) && !isPaidOrder(order) {
			respondError(c, http.StatusBadRequest, "Use verified settlement flow to mark payment as paid")
			return
		}
		order.PaymentStatus = pstatus
	}
	if estatus, ok := req["entitlementStatus"].(string); ok {
		estatus = strings.ToLower(strings.TrimSpace(estatus))
		switch estatus {
		case string(models.EntitlementAuto), string(models.EntitlementGranted), string(models.EntitlementRevoked):
		default:
			respondError(c, http.StatusBadRequest, "Unsupported entitlement status")
			return
		}
		order.EntitlementStatus = estatus
	}

	if err := config.DB.Save(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update order")
		return
	}

	if isPaidOrder(order) {
		_ = issueMissingLicensesForOrder(order.ID)
	}

	if actorID, ok := c.Get("userID"); ok {
		actor := actorID.(uint)
		orderID := order.ID
		services.WriteAuditLog(nil, services.AuditEvent{
			RequestID:    requestIDFromContext(c),
			ActorUserID:  &actor,
			EventType:    "admin.order_updated",
			ResourceType: "order",
			ResourceID:   &orderID,
			Message:      "Admin updated order fields",
			Metadata: map[string]interface{}{
				"status":            order.Status,
				"paymentStatus":     order.PaymentStatus,
				"entitlementStatus": order.EntitlementStatus,
			},
		})
	}

	order.Entitled = computeOrderEntitled(order)
	c.JSON(http.StatusOK, order)
}
