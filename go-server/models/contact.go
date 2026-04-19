package models

import (
	"time"

	"gorm.io/gorm"
)

type ContactInquiry struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `json:"name" binding:"required"`
	Email     string         `json:"email" binding:"required"`
	Subject   string         `json:"subject"`
	Message   string         `json:"message" binding:"required"`
	Reply     string         `json:"reply"`
	Status    string         `gorm:"default:'pending'" json:"status"` // pending, replied
	Sentiment string         `gorm:"size:50;default:'neutral'" json:"sentiment"` 
	Priority  int            `gorm:"default:1" json:"priority"` 
	UserID    *uint          `json:"userId"` // Optional link to registered user
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
