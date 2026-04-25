package models

import "time"

type AffiliateStatus string

const (
	AffiliateStatusPending   AffiliateStatus = "pending"
	AffiliateStatusApproved  AffiliateStatus = "approved"
	AffiliateStatusRejected  AffiliateStatus = "rejected"
	AffiliateStatusSuspended AffiliateStatus = "suspended"
)

type CommissionStatus string

const (
	CommissionPending  CommissionStatus = "pending"
	CommissionApproved CommissionStatus = "approved"
	CommissionPayable  CommissionStatus = "payable"
	CommissionPaid     CommissionStatus = "paid"
	CommissionRejected CommissionStatus = "rejected"
)

type Affiliate struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	UserID          uint            `gorm:"uniqueIndex;not null" json:"userId"`
	User            User            `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Status          string          `gorm:"type:varchar(50);default:'pending';index" json:"status"`
	DisplayName     string          `gorm:"type:varchar(255)" json:"displayName"`
	ReferralCode    string          `gorm:"uniqueIndex;type:varchar(50);not null" json:"referralCode"`
	CommissionType  string          `gorm:"type:varchar(50);default:'percentage'" json:"commissionType"` // percentage, fixed
	CommissionValue float64         `gorm:"type:numeric(10,2);default:10" json:"commissionValue"`        // 10% or ₹100
	PayoutEmail     string          `gorm:"type:varchar(255)" json:"payoutEmail"`
	PayoutMethod    string          `gorm:"type:varchar(50);default:'bank_transfer'" json:"payoutMethod"`
	TotalClicks     int64           `gorm:"default:0" json:"totalClicks"`
	TotalConversions int64          `gorm:"default:0" json:"totalConversions"`
	TotalEarnings   float64         `gorm:"type:numeric(10,2);default:0" json:"totalEarnings"`
	PendingBalance  float64         `gorm:"type:numeric(10,2);default:0" json:"pendingBalance"`
	PaidBalance     float64         `gorm:"type:numeric(10,2);default:0" json:"paidBalance"`
	Notes           string          `gorm:"type:text" json:"notes,omitempty"`
	ApprovedAt      *time.Time      `json:"approvedAt,omitempty"`
	Conversions     []AffiliateConversion    `gorm:"foreignKey:AffiliateID" json:"conversions,omitempty"`
	PayoutRequests  []AffiliatePayoutRequest `gorm:"foreignKey:AffiliateID" json:"payoutRequests,omitempty"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}

type AffiliateClick struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	AffiliateID  uint      `gorm:"not null;index" json:"affiliateId"`
	ProductID    *uint     `gorm:"index" json:"productId,omitempty"`
	ReferralCode string    `gorm:"type:varchar(50);index" json:"referralCode"`
	LandingURL   string    `gorm:"type:varchar(512)" json:"landingUrl"`
	VisitorID    string    `gorm:"type:varchar(255);index" json:"visitorId"`
	IP           string    `gorm:"type:varchar(100)" json:"ip"`
	UserAgent    string    `gorm:"type:varchar(512)" json:"userAgent"`
	CreatedAt    time.Time `json:"createdAt"`
}

type AffiliateConversion struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	AffiliateID      uint       `gorm:"not null;index" json:"affiliateId"`
	Affiliate        Affiliate  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"affiliate,omitempty"`
	OrderID          uint       `gorm:"not null;index" json:"orderId"`
	Order            Order      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"order,omitempty"`
	UserID           *uint      `gorm:"index" json:"userId,omitempty"`
	ProductID        uint       `gorm:"index" json:"productId"`
	CommissionAmount float64    `gorm:"type:numeric(10,2);not null" json:"commissionAmount"`
	CommissionStatus string     `gorm:"type:varchar(50);default:'pending';index" json:"commissionStatus"`
	ConversionSource string    `gorm:"type:varchar(100)" json:"conversionSource"` // link, code, cookie
	ApprovedAt       *time.Time `json:"approvedAt,omitempty"`
	PaidAt           *time.Time `json:"paidAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type AffiliatePayoutRequest struct {
	ID          uint                   `gorm:"primaryKey" json:"id"`
	AffiliateID uint                   `gorm:"not null;index" json:"affiliateId"`
	Affiliate   Affiliate              `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"affiliate,omitempty"`
	Amount      float64                `gorm:"type:numeric(10,2);not null" json:"amount"`
	Status      string                 `gorm:"type:varchar(50);default:'pending';index" json:"status"` // pending, approved, paid, rejected
	Method      string                 `gorm:"type:varchar(50)" json:"method"`
	Details     map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"details,omitempty"`
	RequestedAt time.Time              `json:"requestedAt"`
	ReviewedAt  *time.Time             `json:"reviewedAt,omitempty"`
	PaidAt      *time.Time             `json:"paidAt,omitempty"`
	Notes       string                 `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}
