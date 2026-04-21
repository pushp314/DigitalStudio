package models

import (
	"time"
)

type ProductCategory struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Slug        string    `gorm:"size:100;not null;uniqueIndex" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	Icon        string    `json:"icon"` // Optional icon or emoji
	IsActive    bool      `gorm:"default:true" json:"isActive"`
	SortOrder   int       `gorm:"default:0" json:"sortOrder"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (ProductCategory) TableName() string {
	return "product_categories"
}
