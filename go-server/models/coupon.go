package models

import (
	"strings"
	"time"
)

type DiscountType string

const (
	DiscountPercentage DiscountType = "percentage"
	DiscountFixed      DiscountType = "fixed"
)

type Coupon struct {
	ID            uint         `gorm:"primaryKey" json:"id"`
	Code          string       `gorm:"uniqueIndex;not null;size:50" json:"code"`
	DiscountType  DiscountType `gorm:"type:varchar(20);default:'percentage'" json:"discountType"`
	DiscountValue float64      `json:"discountValue"` // Percentage or fixed amount
	MinPurchase   float64      `gorm:"default:0" json:"minPurchase"`
	ApplicableTo  string       `gorm:"size:50;default:'all'" json:"applicableTo"` // all, membership, template, support
	UsageLimit    int          `gorm:"default:100" json:"usageLimit"`
	UsedCount     int          `gorm:"default:0" json:"usedCount"`
	Active        bool         `gorm:"default:true" json:"active"`
	ExpiresAt     *time.Time   `json:"expiresAt"`
	CreatedAt     time.Time    `json:"createdAt"`
	UpdatedAt     time.Time    `json:"updatedAt"`
}

func NormalizeCouponCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

func (c *Coupon) IsValid(amount float64, scope string) bool {
	if !c.Active {
		return false
	}
	if c.ApplicableTo != "all" && c.ApplicableTo != scope {
		return false
	}
	if c.ExpiresAt != nil && time.Now().After(*c.ExpiresAt) {
		return false
	}
	if c.UsageLimit > 0 && c.UsedCount >= c.UsageLimit {
		return false
	}
	if amount < c.MinPurchase {
		return false
	}
	return true
}

func (c *Coupon) CalculateDiscount(amount float64) float64 {
	if c.DiscountType == DiscountPercentage {
		return amount * (c.DiscountValue / 100.0)
	}
	// Fixed Discount
	if c.DiscountValue > amount {
		return amount
	}
	return c.DiscountValue
}
