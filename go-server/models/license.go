package models

import (
	"time"
)

type LicenseType string

const (
	LicensePersonal   LicenseType = "personal"
	LicenseCommercial LicenseType = "commercial"
)

type LicenseStatus string

const (
	LicenseStatusActive  LicenseStatus = "active"
	LicenseStatusExpired LicenseStatus = "expired"
	LicenseStatusRevoked LicenseStatus = "revoked"
)

type License struct {
	ID         uint        `gorm:"primaryKey" json:"id"`
	UserID     uint        `gorm:"not null" json:"userId"`
	User       User        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ProductID  uint        `gorm:"not null" json:"productId"`
	Product    Product     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"product,omitempty"`
	OrderID    uint        `gorm:"not null" json:"orderId"`
	Order      Order       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"order,omitempty"`
	Type       LicenseType `gorm:"type:varchar(50);default:'personal'" json:"type"`
	LicenseKey string      `gorm:"uniqueIndex;not null" json:"licenseKey"`
	Status     string      `gorm:"type:varchar(50);default:'active'" json:"status"` // active, expired, revoked
	ExpiryDate *time.Time  `json:"expiryDate,omitempty"`
	CreatedAt  time.Time   `json:"createdAt"`
	UpdatedAt  time.Time   `json:"updatedAt"`
}
