package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)


func AdminListOrders(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))

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
	default:
		respondError(c, http.StatusBadRequest, "Unsupported order status filter")
		return
	}

	if err := query.Find(&orders).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}

	for idx := range orders {
		orders[idx].Entitled = computeOrderEntitled(orders[idx])
	}

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
		order.Status = status
	}
	if pstatus, ok := req["paymentStatus"].(string); ok {
		order.PaymentStatus = pstatus
	}
	if estatus, ok := req["entitlementStatus"].(string); ok {
		order.EntitlementStatus = estatus
	}

	if err := config.DB.Save(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update order")
		return
	}

	if isPaidOrder(order) {
		_ = issueMissingLicensesForOrder(order.ID)
	}

	order.Entitled = computeOrderEntitled(order)
	c.JSON(http.StatusOK, order)
}
