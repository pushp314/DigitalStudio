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
	Provider         string    `gorm:"type:varchar(50)" json:"provider"`
	ProviderID       string    `gorm:"type:varchar(255)" json:"providerId"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}
