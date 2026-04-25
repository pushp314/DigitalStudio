package models

import (
	"time"

	"gorm.io/gorm"
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
	ProductTypeSubscription ProductType = "subscription"
)

type ModerationStatus string

const (
	ModStatusPending  ModerationStatus = "pending"
	ModStatusApproved ModerationStatus = "approved"
	ModStatusRejected ModerationStatus = "rejected"
)

type ChangelogEntry struct {
	Version string   `json:"version"`
	Date    string   `json:"date"` // e.g., "2024-03-24"
	Changes []string `json:"changes"`
}

type ProductPreview struct {
	URL       string `json:"url"`
	Alt       string `json:"alt,omitempty"`
	Caption   string `json:"caption,omitempty"`
	SortOrder int    `json:"sortOrder,omitempty"`
}

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
	CategoryID           *uint            `json:"categoryId"`
	CategoryRel          *ProductCategory `gorm:"foreignKey:CategoryID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"categoryRel,omitempty"`
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

	// Storage Integration Fields
	StorageProvider      string           `gorm:"size:50;default:'local'" json:"storageProvider"`
	StorageKey           string           `gorm:"size:255" json:"storageKey"`
	OriginalFilename     string           `gorm:"size:255" json:"originalFilename"`
	FileSize             int64            `json:"fileSize"`
	MimeType             string           `gorm:"size:100" json:"mimeType"`
	IsPrivateAsset       bool             `gorm:"default:true" json:"isPrivateAsset"`

	VideoURL        string   `json:"videoUrl"`
	CourseOutline   string   `gorm:"type:text" json:"courseOutline"`
	Duration        string   `json:"duration"`
	PreviewImages   []ProductPreview `gorm:"serializer:json;type:jsonb" json:"previewImages,omitempty"`
	SnippetLanguage string   `json:"snippetLanguage"`
	Snippet         string   `gorm:"type:text" json:"snippet"`
	Features        []string `gorm:"serializer:json;type:jsonb" json:"features,omitempty"`
	Pages           []string `gorm:"serializer:json;type:jsonb" json:"pages,omitempty"`

	TechStacks    []string `gorm:"serializer:json;type:jsonb" json:"techStack,omitempty"`
	Changelog     []ChangelogEntry `gorm:"serializer:json;type:jsonb" json:"changelog,omitempty"`
	Documentation []string `gorm:"serializer:json;type:jsonb" json:"documentation,omitempty"`
	Tags          []Tag    `gorm:"many2many:product_tags;" json:"tags,omitempty"`

	// SEO Meta
	SEOTitle       string `gorm:"size:255" json:"seoTitle"`
	SEODescription string `gorm:"type:text" json:"seoDescription"`
	OGImage        string `gorm:"size:255" json:"ogImage"`

	PreviewURL string  `gorm:"-" json:"previewUrl,omitempty"`
	Rating     float64 `gorm:"-" json:"rating"`
	NumReviews int64   `gorm:"-" json:"numReviews"`
	NumSales   int64   `gorm:"-" json:"numSales"`
	Revenue    float64 `gorm:"-" json:"revenue"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Tag struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"uniqueIndex;not null;size:100" json:"name"`
}
