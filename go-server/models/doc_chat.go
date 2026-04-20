package models

import (
	"time"
)

type DocChatSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"userId"`
	DocID     uint      `gorm:"index" json:"docId"`
	History   string    `gorm:"type:text" json:"history"` // JSON array of messages: [{role: 'user', content: '...'}, {role: 'ai', content: '...'}]
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
