package models

import (
	"time"
)

type ServiceIntent struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Slug         string    `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Headline     string    `gorm:"size:255" json:"headline"`
	Subheadline  string    `gorm:"size:255" json:"subheadline"`
	Description  string    `gorm:"type:text" json:"description"`
	CTA          string    `gorm:"size:100" json:"cta"`
	IsActive     bool      `gorm:"default:true" json:"isActive"`
	SortOrder    int       `gorm:"default:0" json:"sortOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type ExpertIntent struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Slug         string    `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Headline     string    `gorm:"size:255" json:"headline"`
	Subheadline  string    `gorm:"size:255" json:"subheadline"`
	Description  string    `gorm:"type:text" json:"description"`
	CTA          string    `gorm:"size:100" json:"cta"`
	IsPaid       bool      `gorm:"default:false" json:"isPaid"`
	BaseFee      float64   `gorm:"type:decimal(10,2);default:0" json:"baseFee"`
	IsActive     bool      `gorm:"default:true" json:"isActive"`
	SortOrder    int       `gorm:"default:0" json:"sortOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
