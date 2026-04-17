package models

import (
	"time"
)

type SiteConfig struct {
	ID                  uint            `gorm:"primaryKey" json:"id"`
	HeroTitle           string          `json:"heroTitle"`
	HeroSubtitle        string          `json:"heroSubtitle"`
	AnnouncementMessage string          `json:"announcementMessage"`
	ShowAnnouncement    bool            `json:"showAnnouncement"`
	SupportEmail        string          `json:"supportEmail"`
	Features            map[string]bool `gorm:"serializer:json;type:jsonb" json:"features,omitempty"`
	CreatedAt           time.Time       `json:"createdAt"`
	UpdatedAt           time.Time       `json:"updatedAt"`
}
