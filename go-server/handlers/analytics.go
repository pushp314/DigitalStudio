package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
)

type RevenuePoint struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type CategoryMetric struct {
	Category string  `json:"category"`
	Count    int64   `json:"count"`
	Revenue  float64 `json:"revenue"`
}

func GetIntelligenceMetrics(c *gin.Context) {
	// 1. 7-Day Revenue Velocity (Sequential SQL Aggregation)
	var revenueStats []RevenuePoint
	config.DB.Raw(`
		SELECT 
			TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
			SUM(total_price) as revenue
		FROM orders
		WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'
		GROUP BY date_trunc('day', created_at)
		ORDER BY date_trunc('day', created_at) ASC
	`).Scan(&revenueStats)

	// 2. Top Performing Categories
	var categoryStats []CategoryMetric
	config.DB.Raw(`
		SELECT 
			p.category,
			COUNT(oi.id) as count,
			SUM(oi.price * oi.quantity) as revenue
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		JOIN orders o ON o.id = oi.order_id
		WHERE o.status = 'paid'
		GROUP BY p.category
		ORDER BY revenue DESC
		LIMIT 5
	`).Scan(&categoryStats)

	// 3. Conversion Matrix (Simplified: Orders vs Total Users)
	var totalUsers int64
	var totalOrders int64
	config.DB.Table("users").Count(&totalUsers)
	config.DB.Table("orders").Where("status = 'paid'").Count(&totalOrders)

	conversionRate := 0.0
	if totalUsers > 0 {
		conversionRate = (float64(totalOrders) / float64(totalUsers)) * 100
	}

	// 4. Activity Pulse
	var recentSales int64
	config.DB.Table("orders").Where("status = 'paid' AND created_at >= NOW() - INTERVAL '24 hours'").Count(&recentSales)

	c.JSON(http.StatusOK, gin.H{
		"revenueVelocity": revenueStats,
		"topCategories":   categoryStats,
		"conversionRate":  conversionRate,
		"recentSales":     recentSales,
		"totalUsers":      totalUsers,
		"totalOrders":     totalOrders,
		"timestamp":       time.Now(),
	})
}
