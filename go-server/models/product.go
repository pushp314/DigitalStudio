package models

import (
	"time"
)

type ProductType string

const (
	ProductTypeTemplate    ProductType = "template"
	ProductTypeFullstack   ProductType = "fullstack"
	ProductTypeApi         ProductType = "api"
	ProductTypeComponent   ProductType = "component"
	ProductTypeUIKit       ProductType = "ui_kit"
	ProductTypeIconSet     ProductType = "icon_set"
	ProductTypeCodeSnippet ProductType = "code_snippet"
	ProductTypeEduModule   ProductType = "edu_module"
)

type ModerationStatus string

const (
	ModStatusPending  ModerationStatus = "pending"
	ModStatusApproved ModerationStatus = "approved"
	ModStatusRejected ModerationStatus = "rejected"
)

type Product struct {
	ID                   uint             `gorm:"primaryKey" json:"id"`
	AuthorID             uint             `json:"authorId"`
	Author               User             `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"author,omitempty"`
	Title                string           `gorm:"not null" json:"title"`
	Slug                 string           `gorm:"uniqueIndex;not null" json:"slug"`
	Description          string           `gorm:"type:text" json:"description"`
	LongDescription      string           `gorm:"type:text" json:"longDescription"`
	Price                float64          `gorm:"type:numeric(10,2);not null;default:0" json:"price"`
	Category             string           `gorm:"size:100" json:"category"`
	Type                 ProductType      `gorm:"type:varchar(50);default:'template'" json:"productType"`
	StatusFlags          string           `gorm:"type:varchar(100);default:'active'" json:"statusFlags"`
	ModerationStatus     ModerationStatus `gorm:"type:varchar(50);default:'approved'" json:"moderationStatus"`
	Image                string           `json:"image"`
	LiveDemo             string           `json:"liveDemo"`
	GithubRepo           string           `json:"githubRepo"`
	FileURL              string           `json:"fileURL"`
	Version              string           `gorm:"default:'1.0.0'" json:"version"`
	RequiresSubscription bool             `gorm:"default:false" json:"requiresSubscription"`
	RevenueShare         float64          `gorm:"default:0" json:"revenueShare"`

	VideoURL        string   `json:"videoUrl"`
	CourseOutline   string   `gorm:"type:text" json:"courseOutline"`
	Duration        string   `json:"duration"`
	PreviewImages   []string `gorm:"serializer:json;type:jsonb" json:"previewImages,omitempty"`
	SnippetLanguage string   `json:"snippetLanguage"`
	Snippet         string   `gorm:"type:text" json:"snippet"`

	TechStacks    []string `gorm:"serializer:json;type:jsonb" json:"techStack,omitempty"`
	Documentation []string `gorm:"serializer:json;type:jsonb" json:"documentation,omitempty"`
	Tags          []Tag    `gorm:"many2many:product_tags;" json:"tags,omitempty"`

	PreviewURL string  `gorm:"-" json:"previewUrl,omitempty"`
	Rating     float64 `gorm:"-" json:"rating"`
	NumReviews int64   `gorm:"-" json:"numReviews"`
	NumSales   int64   `gorm:"-" json:"numSales"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Tag struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"uniqueIndex;not null;size:100" json:"name"`
}
