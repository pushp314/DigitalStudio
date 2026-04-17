package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
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

	var total float64
	var orderItems []models.OrderItem

	for _, itemReq := range req.Items {
		var product models.Product
		if err := config.DB.First(&product, itemReq.ProductID).Error; err != nil {
			respondError(c, http.StatusBadRequest, fmt.Sprintf("Product ID %d not found", itemReq.ProductID))
			return
		}

		price := product.Price
		total += price * float64(itemReq.Quantity)

		orderItems = append(orderItems, models.OrderItem{
			ProductID: product.ID,
			Quantity:  itemReq.Quantity,
			Price:     price,
		})
	}

	order := models.Order{
		UserID:     userID.(uint),
		TotalPrice: total,
		Status:     "pending",
		PaymentStatus: "pending",
		OrderItems: orderItems,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create order")
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
	if err := config.DB.Preload("OrderItems").Preload("OrderItems.Product").Where("user_id = ?", userID).Find(&orders).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}

	for idx := range orders {
		orders[idx].Entitled = orders[idx].PaymentStatus == "paid" || orders[idx].Status == "paid"
	}

	c.JSON(http.StatusOK, orders)
}
