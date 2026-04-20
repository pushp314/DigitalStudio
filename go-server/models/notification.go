package models

import (
	"time"
)

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // info, success, warning, error, alert
	Target    string    `json:"target"` // all, pro, individual
	UserID    uint      `json:"userId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	IsRead    bool      `gorm:"default:false" json:"isRead"`
}
