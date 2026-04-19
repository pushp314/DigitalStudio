package models

import "time"

type Review struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	UserID           uint      `gorm:"not null" json:"userId"`
	User             User      `json:"user,omitempty"`
	ProductID        uint      `gorm:"not null" json:"productId"`
	Rating           int       `gorm:"not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment          string    `gorm:"type:text" json:"comment"`
	Status           string    `gorm:"type:varchar(50);default:'approved'" json:"status"`
	VerifiedPurchase bool      `gorm:"not null;default:false" json:"verifiedPurchase"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}
