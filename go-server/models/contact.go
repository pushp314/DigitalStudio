package models

import (
	"time"

	"gorm.io/gorm"
)

// SharedInquiryFields can be used to keep common logic if needed
type SharedInquiryFields struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `json:"name" binding:"required"`
	Email     string         `json:"email" binding:"required"`
	Subject   string         `json:"subject"`
	Message   string         `json:"message" binding:"required"`
	Reply     string         `json:"reply"`
	Status    string         `gorm:"default:'pending'" json:"status"` // pending, replied
	Sentiment string         `gorm:"size:50;default:'neutral'" json:"sentiment"`
	Priority  int            `gorm:"default:1" json:"priority"`
	UserID    *uint          `json:"userId"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type HireDeveloperRequest struct {
	SharedInquiryFields
	ServiceIntentID *uint          `json:"serviceIntentId"`
	ServiceIntent   *ServiceIntent `gorm:"foreignKey:ServiceIntentID" json:"serviceIntent,omitempty"`
}

func (HireDeveloperRequest) TableName() string {
	return "hire_developer_requests"
}

type ExpertHelpRequest struct {
	SharedInquiryFields
	ExpertIntentID *uint         `json:"expertIntentId"`
	ExpertIntent   *ExpertIntent `gorm:"foreignKey:ExpertIntentID" json:"expertIntent,omitempty"`
}

func (ExpertHelpRequest) TableName() string {
	return "expert_help_requests"
}
