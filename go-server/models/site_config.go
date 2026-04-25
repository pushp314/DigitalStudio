package models

import (
	"time"
)

type FAQItem struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

type SocialProofConfig struct {
	Rating           string   `json:"rating"`
	Summary          string   `json:"summary"`
	CreatorsLabel    string   `json:"creatorsLabel"`
	TrustedCompanies []string `json:"trustedCompanies,omitempty"`
	AvatarImages     []string `json:"avatarImages,omitempty"`
}

type ShowcaseItem struct {
	Title       string `json:"title"`
	Subtitle    string `json:"subtitle"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Footer      string `json:"footer"`
}

type CarouselItem struct {
	Image string `json:"image"`
	Link  string `json:"link"`
	Title string `json:"title"`
}

type ContactConfig struct {
	Heading    string `json:"heading"`
	Subheading string `json:"subheading"`
	Email      string `json:"email"`
	Address    string `json:"address"`
	Phone      string `json:"phone"`
}

type AISettings struct {
	Enabled      bool   `json:"enabled"`
	EnableDocsAI bool   `json:"enableDocsAi"`
	EnableChatAI bool   `json:"enableChatAi"`
	ServiceURL   string `json:"serviceUrl"`
	Provider     string `json:"provider"` // gemini (locked)
	Model        string `json:"model"`
	APIKey       string `json:"apiKey,omitempty"`
}

type EliteSettings struct {
	NegotiationEnabled bool    `json:"negotiationEnabled"`
	NegotiationFee     float64 `json:"negotiationFee"`
	SupportMonthlyFee  float64 `json:"supportMonthlyFee"`
	ServiceBenefitDays int     `json:"serviceBenefitDays"` // e.g. 30 days of chat for buyers
	DeploymentFee      float64 `json:"deploymentFee"`
}

type MemberPlan struct {
	Name        string   `json:"name"`
	Badge       string   `json:"badge"`
	Price       int      `json:"price"`
	Period      string   `json:"period"`
	Features    []string `json:"features"`
	ButtonText  string   `json:"buttonText"`
	IsPopular   bool     `json:"isPopular"`
	IsPrimary   bool     `json:"isPrimary"` // If true, uses the dark theme and handleSubscribe logic
}

type SiteConfig struct {
	ID                  uint            `gorm:"primaryKey" json:"id"`
	HeroTitle           string          `json:"heroTitle"`
	HeroSubtitle        string          `json:"heroSubtitle"`
	HeroImages          []string        `gorm:"serializer:json;type:jsonb" json:"heroImages,omitempty"`
	HeroVisualEffect    string          `gorm:"default:'stack'" json:"heroVisualEffect"`
	Announcements       []string        `gorm:"serializer:json;type:jsonb" json:"announcements"`
	CarouselStack       []CarouselItem  `gorm:"serializer:json;type:jsonb" json:"carouselStack,omitempty"`
	ShowAnnouncement    bool            `json:"showAnnouncement"`
	SupportEmail        string          `json:"supportEmail"`
	Features            map[string]bool `gorm:"serializer:json;type:jsonb" json:"features,omitempty"`
	MemberPlans         []MemberPlan    `gorm:"serializer:json;type:jsonb" json:"memberPlans,omitempty"`
	FAQs                []FAQItem       `gorm:"serializer:json;type:jsonb" json:"faqs,omitempty"`
	SocialProof         SocialProofConfig `gorm:"serializer:json;type:jsonb" json:"socialProof"`
	ShowcaseItems       []ShowcaseItem  `gorm:"serializer:json;type:jsonb" json:"showcaseItems,omitempty"`
	Contact             ContactConfig   `gorm:"serializer:json;type:jsonb" json:"contact"`
	AISettings          AISettings      `gorm:"serializer:json;type:jsonb" json:"aiSettings"`
	EliteSettings       EliteSettings   `gorm:"serializer:json;type:jsonb" json:"eliteSettings"`
	FrontendURL         string          `gorm:"type:varchar(255)" json:"frontendUrl"`
	MaintenanceMode     bool            `gorm:"default:false" json:"maintenanceMode"`
	MaintenanceMessage  string          `gorm:"default:'We are currently performing a scheduled maintenance sequence. Please check back shortly.'" json:"maintenanceMessage"`
	CreatedAt           time.Time       `json:"createdAt"`
	UpdatedAt           time.Time       `json:"updatedAt"`
}
