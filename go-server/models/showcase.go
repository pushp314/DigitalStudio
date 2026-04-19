package models

import "time"

type ShowcaseStatus string

const (
	ShowcasePending  ShowcaseStatus = "pending"
	ShowcaseApproved ShowcaseStatus = "approved"
	ShowcaseRejected ShowcaseStatus = "rejected"
)

type Showcase struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null" json:"userId"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
	ProductID   uint           `gorm:"not null" json:"productId"`
	Product     Product        `gorm:"foreignKey:ProductID" json:"product"`
	LiveURL     string         `gorm:"size:255" json:"liveUrl"`
	Screenshot  string         `gorm:"size:512" json:"screenshot"` // R2 URL
	Status      ShowcaseStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	RewardPaid  bool           `gorm:"default:false" json:"rewardPaid"`
	CreatedAt   time.Time      `json:"createdAt"`
}
