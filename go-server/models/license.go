package models

import "time"

type LicenseType string

const (
	LicensePersonal LicenseType = "personal"
	LicenseTeam     LicenseType = "team"
	LicenseExtended LicenseType = "extended"
)

type License struct {
	ID         uint        `gorm:"primaryKey" json:"id"`
	UserID     uint        `gorm:"not null" json:"userId"`
	ProductID  uint        `gorm:"not null" json:"productId"`
	OrderID    uint        `json:"orderId"`
	Type       LicenseType `gorm:"type:varchar(50);default:'personal'" json:"type"`
	LicenseKey string      `gorm:"uniqueIndex;not null" json:"licenseKey"`
	ExpiryDate *time.Time  `json:"expiryDate"`
	CreatedAt  time.Time   `json:"createdAt"`
}
