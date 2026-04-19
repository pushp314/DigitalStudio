package models

import (
	"time"
)

type TOCItem struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Level int    `json:"level"`
}

type PremiumDoc struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Title           string    `gorm:"not null" json:"title"`
	Description     string    `gorm:"type:text" json:"description"`
	Content         string    `gorm:"type:text" json:"content"`
	PreviewContent  string    `gorm:"type:text" json:"previewContent"`
	Category        string    `json:"category"`
	Price           float64   `gorm:"type:numeric(10,2);not null;default:0" json:"price"`
	IsPremium       bool      `gorm:"default:true" json:"isPremium"`
	Icon            string    `json:"icon"`
	Image           string    `json:"image"`
	TableOfContents []TOCItem `gorm:"serializer:json;type:jsonb" json:"tableOfContents,omitempty"`

	DocTags []string `gorm:"serializer:json;type:jsonb" json:"tags,omitempty"`

	HasAccess bool `gorm:"-" json:"hasAccess"`
	Locked    bool `gorm:"-" json:"locked"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
