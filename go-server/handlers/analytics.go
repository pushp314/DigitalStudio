package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func GetSalesAnalytics(c *gin.Context) {
	// Simple analytical aggregation grouping items
	type SalesSummary struct {
		ProductID uint    `json:"productId"`
		Title     string  `json:"title"`
		TotalSold int     `json:"totalSold"`
		Revenue   float64 `json:"revenue"`
	}

	var summary []SalesSummary
	config.DB.Table("order_items").
		Select("order_items.product_id, products.title, sum(order_items.quantity) as total_sold, sum(order_items.price * order_items.quantity) as revenue").
		Joins("JOIN products on products.id = order_items.product_id").
		Group("order_items.product_id, products.title").
		Scan(&summary)

	c.JSON(http.StatusOK, summary)
}

func GetTopProducts(c *gin.Context) {
	var products []models.Product
	config.DB.Limit(5).Find(&products)
	c.JSON(http.StatusOK, products)
}
