package models

import (
	"time"
)

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	Content   string    `json:"content"`
	Type      string    `gorm:"default:'text'" json:"type"` // text, code, system
	IsPro     bool      `json:"isPro"`
	CreatedAt time.Time `json:"createdAt"`
}
