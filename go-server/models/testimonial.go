package models

import (
	"time"
)

type Testimonial struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null" json:"userId"`
	User      User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ProductID uint      `gorm:"not null" json:"productId"`
	Product   Product   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"product,omitempty"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Rating    int       `gorm:"default:5" json:"rating"`
	Status    string    `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, approved, rejected
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
