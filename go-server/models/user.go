package models

import (
	"time"
	"gorm.io/gorm"
)

type Role string

const (
	RoleUser        Role = "user"
	RoleAdmin       Role = "admin"
	RoleContributor Role = "contributor"
)

type GithubChangeRequest struct {
	gorm.Model
	UserID   uint   `json:"userId"`
	User     User   `gorm:"foreignKey:UserID" json:"user"`
	Reason   string `gorm:"type:text" json:"reason"`
	Status   string `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, approved, rejected
	Resolved bool   `gorm:"default:false" json:"resolved"`
}

type User struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	Name             string    `gorm:"size:255" json:"name"`
	Username         *string   `gorm:"uniqueIndex;size:50;default:null" json:"username"`
	AvatarURL        string    `gorm:"size:512" json:"avatarUrl"`
	Email            string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Password         string    `json:"-"`
	Role             Role      `gorm:"type:varchar(20);default:'user'" json:"role"`
	SubscriptionPlan string    `gorm:"type:varchar(50);default:'free'" json:"subscriptionPlan"`
	IsPro            bool      `gorm:"default:false" json:"isPro"`
	ProExpiresAt     *time.Time `json:"proExpiresAt"`
	Provider         string    `gorm:"type:varchar(50)" json:"provider"`
	ProviderID       string    `gorm:"type:varchar(255)" json:"providerId"`
	Suspended        bool       `gorm:"not null;default:false" json:"suspended"`
	Bio              string     `gorm:"type:text" json:"bio"`
	Website          string     `gorm:"size:255" json:"website"`
	Github           string     `gorm:"size:255" json:"github"`
	GithubID         string     `gorm:"uniqueIndex;size:100" json:"githubId"`
	Twitter          string     `gorm:"size:255" json:"twitter"`
	
	// Identity Management
	GithubRequests []GithubChangeRequest `gorm:"foreignKey:UserID" json:"githubRequests,omitempty"`
	
	// Partner Protocol Fields
	PartnerCode      *string   `gorm:"uniqueIndex;type:varchar(50);default:null" json:"partnerCode"`
	ReferrerID       *uint     `gorm:"index" json:"referrerId"`
	PartnerBalance   float64   `gorm:"default:0" json:"partnerBalance"`
	EliteCustomBuilds int       `gorm:"default:0" json:"eliteCustomBuilds"`
	
	// Growth Matrix Fields
	FlashSaleExpiresAt *time.Time `json:"flashSaleExpiresAt"`
	MatrixCredits      float64    `gorm:"default:0" json:"matrixCredits"`
	
	// Chat Modulation Settings (JSON)
	ChatSettings      string     `gorm:"type:text;default:'{\"sounds\":true,\"hideTyping\":false,\"hideReadReceipts\":false,\"compactMode\":false}'" json:"chatSettings"`
	
	// Gamification & Identity Matrix
	XP                int        `gorm:"default:0" json:"xp"`
	Rank              string     `gorm:"type:varchar(50);default:'Junior'" json:"rank"`
	TotalCommits     int        `gorm:"default:0" json:"totalCommits"`
	TotalStars       int        `gorm:"default:0" json:"totalStars"`
	TotalFollowers   int        `gorm:"default:0" json:"totalFollowers"`
	TotalGists       int        `gorm:"default:0" json:"totalGists"`
	GithubAccountAge int        `gorm:"default:0" json:"githubAccountAge"`
	TotalDeployments int        `gorm:"default:0" json:"totalDeployments"`
	LastGithubSync    *time.Time `json:"lastGithubSync"`
	LastUsernameChangeAt *time.Time `json:"lastUsernameChangeAt"`
	
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type DeploymentSubmission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"-"`
	ProjectName string    `gorm:"size:255" json:"projectName"`
	LiveURL     string    `gorm:"size:512" json:"liveUrl"`
	Thumbnail   string    `gorm:"size:512" json:"thumbnail"`
	Status      string    `gorm:"size:20;default:'pending'" json:"status"` // pending, approved, rejected
	AdminNotes  string    `gorm:"type:text" json:"adminNotes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
