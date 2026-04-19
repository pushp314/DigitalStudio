package models

import (
	"time"
)

type Role string

const (
	RoleUser        Role = "user"
	RoleAdmin       Role = "admin"
	RoleContributor Role = "contributor"
)

type User struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	Name             string    `gorm:"size:255" json:"name"`
	Email            string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Password         string    `json:"-"`
	Role             Role      `gorm:"type:varchar(20);default:'user'" json:"role"`
	SubscriptionPlan string    `gorm:"type:varchar(50);default:'free'" json:"subscriptionPlan"`
	IsPro            bool      `gorm:"default:false" json:"isPro"`
	ProExpiresAt     *time.Time `json:"proExpiresAt"`
	Provider         string    `gorm:"type:varchar(50)" json:"provider"`
	ProviderID       string    `gorm:"type:varchar(255)" json:"providerId"`
	Suspended        bool      `gorm:"not null;default:false" json:"suspended"`
	
	// Partner Protocol Fields
	PartnerCode      string    `gorm:"uniqueIndex;type:varchar(50)" json:"partnerCode"`
	ReferrerID       *uint     `json:"referrerId"`
	PartnerBalance   float64   `gorm:"default:0" json:"partnerBalance"`
	
	// Growth Matrix Fields
	FlashSaleExpiresAt *time.Time `json:"flashSaleExpiresAt"`
	MatrixCredits      float64    `gorm:"default:0" json:"matrixCredits"`
	
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}
