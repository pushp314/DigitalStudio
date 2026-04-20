package models

import (
	"time"
)

type EliteChatSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	ProductID uint      `gorm:"index" json:"productId"`
	Title     string    `gorm:"size:255" json:"title"`
	Status    string    `gorm:"size:20;default:'active'" json:"status"` // active, closed, resolved, expired
	Source    string    `gorm:"size:30;default:'negotiation'" json:"source"` // negotiation, purchase, manual
	PaymentID *uint     `json:"paymentId,omitempty"` // links to Order.ID if payment-based
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Virtual fields for support dashboard
	MessageCount int `gorm:"-" json:"messageCount"`
	UnreadCount  int `gorm:"-" json:"unreadCount"`
}

type EliteChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID uint      `gorm:"index" json:"sessionId"`
	SenderID  uint      `gorm:"index" json:"senderId"`
	Message   string    `gorm:"type:text" json:"message"`
	IsAdmin   bool      `json:"isAdmin"`
	IsRead    bool      `gorm:"default:false" json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}
