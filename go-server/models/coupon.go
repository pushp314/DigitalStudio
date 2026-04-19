package models

import (
	"time"
	"gorm.io/gorm"
)

type DiscountType string

const (
	DiscountPercentage DiscountType = "percentage"
	DiscountFlat       DiscountType = "flat"
)

type Coupon struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Code          string         `gorm:"uniqueIndex;not null" json:"code"`
	DiscountType  DiscountType   `gorm:"type:varchar(20);not null" json:"discountType"`
	DiscountValue float64        `gorm:"not null" json:"discountValue"`
	MinPurchase   float64        `gorm:"default:0" json:"minPurchase"`
	UsageLimit    int            `gorm:"default:0" json:"usageLimit"` // 0 = unlimited
	UsageCount    int            `gorm:"default:0" json:"usageCount"`
	ExpiresAt     *time.Time     `json:"expiresAt"`
	Active        bool           `gorm:"default:true" json:"active"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (c *Coupon) IsValid(orderAmount float64) bool {
	if !c.Active {
		return false
	}
	if c.ExpiresAt != nil && time.Now().After(*c.ExpiresAt) {
		return false
	}
	if c.UsageLimit > 0 && c.UsageCount >= c.UsageLimit {
		return false
	}
	if orderAmount < c.MinPurchase {
		return false
	}
	return true
}

func (c *Coupon) CalculateDiscount(orderAmount float64) float64 {
	if c.DiscountType == DiscountPercentage {
		return (orderAmount * c.DiscountValue) / 100
	}
	return c.DiscountValue
}
