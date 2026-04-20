package models

import (
	"time"
)

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	UserHandle string   `json:"username"`
	UserAvatar string   `json:"userAvatar"`
	Content   string    `json:"content"`
	Type      string    `gorm:"default:'text'" json:"type"` // text, code, image, system
	AttachmentURL string `json:"attachmentUrl"`
	IsImage     bool      `gorm:"default:false" json:"isImage"`
	IsPro       bool      `json:"isPro"`
	Role        string    `json:"role"`
	IsPinned    bool      `gorm:"default:false" json:"isPinned"`
	ParentID    *uint     `json:"parentId"`     // ID of the message being replied to
	ReplyToName string    `json:"replyToName"`  // Name of the user being replied to
	ReplyToContent string `json:"replyToContent"` // Content of the message being replied to
	ReportCount int       `gorm:"default:0" json:"reportCount"`
	CreatedAt   time.Time `json:"createdAt"`
}
