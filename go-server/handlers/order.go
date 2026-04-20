package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
)

type OrderItemReq struct {
	ProductID uint `json:"productId" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type CreateOrderReq struct {
	Items []OrderItemReq `json:"items" binding:"required,min=1"`
}

func CreateOrder(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateOrderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	items := make([]services.DraftOrderItemInput, 0, len(req.Items))
	for _, itemReq := range req.Items {
		items = append(items, services.DraftOrderItemInput{
			ProductID: itemReq.ProductID,
			Quantity:  itemReq.Quantity,
		})
	}

	order, err := services.CreateDraftOrder(c.Request.Context(), services.DraftOrderInput{
		UserID:    userID.(uint),
		Items:     items,
		Currency:  "INR",
		RequestID: requestIDFromContext(c),
	})
	if err != nil {
		switch err {
		case services.ErrInvalidOrderItems:
			respondError(c, http.StatusBadRequest, err.Error())
		default:
			respondError(c, http.StatusInternalServerError, "Failed to create order")
		}
		return
	}

	order.Entitled = false
	c.JSON(http.StatusCreated, order)
}

func MyOrders(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var orders []models.Order
	if err := config.DB.
		Preload("OrderItems").
		Preload("OrderItems.Product").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&orders).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}

	for idx := range orders {
		orders[idx].Entitled = computeOrderEntitled(orders[idx])
	}

	c.JSON(http.StatusOK, orders)
}
