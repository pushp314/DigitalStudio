package models

import "time"

type CheckoutSessionStatus string

const (
	CheckoutActive    CheckoutSessionStatus = "active"
	CheckoutConverted CheckoutSessionStatus = "converted"
	CheckoutAbandoned CheckoutSessionStatus = "abandoned"
	CheckoutExpired   CheckoutSessionStatus = "expired"
)

type CheckoutSession struct {
	ID                uint                   `gorm:"primaryKey" json:"id"`
	UserID            *uint                  `gorm:"index" json:"userId,omitempty"`
	Email             string                 `gorm:"type:varchar(255);index" json:"email,omitempty"`
	CartItems         []map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"cartItems,omitempty"`
	CartTotal         float64                `gorm:"type:numeric(10,2);default:0" json:"cartTotal"`
	WhiteGloveSelected bool                  `gorm:"default:false;index" json:"whiteGloveSelected"`
	DeploymentFee     float64                `gorm:"type:numeric(10,2);default:0" json:"deploymentFee"`
	CouponCode        string                 `gorm:"type:varchar(100)" json:"couponCode,omitempty"`
	Status            string                 `gorm:"type:varchar(50);default:'active';index" json:"status"`
	OrderID           *uint                  `gorm:"index" json:"orderId,omitempty"`
	RecoveryStage     int                    `gorm:"default:0" json:"recoveryStage"`
	RecoveredAt       *time.Time             `json:"recoveredAt,omitempty"`
	CompletedAt       *time.Time             `json:"completedAt,omitempty"`
	Metadata          map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"metadata,omitempty"`
	StartedAt         time.Time              `json:"startedAt"`
	CreatedAt         time.Time              `json:"createdAt"`
	UpdatedAt         time.Time              `json:"updatedAt"`
}

type CartRecoveryLog struct {
	ID                uint                   `gorm:"primaryKey" json:"id"`
	CheckoutSessionID uint                   `gorm:"not null;index" json:"checkoutSessionId"`
	Email             string                 `gorm:"type:varchar(255)" json:"email"`
	RecoveryStage     int                    `gorm:"not null" json:"recoveryStage"` // 1, 2, 3
	SentAt            time.Time              `json:"sentAt"`
	Status            string                 `gorm:"type:varchar(50);default:'sent'" json:"status"` // sent, delivered, opened, clicked, failed
	Metadata          map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"metadata,omitempty"`
	CreatedAt         time.Time              `json:"createdAt"`
}

type ImportJob struct {
	ID          uint                   `gorm:"primaryKey" json:"id"`
	AdminUserID uint                   `gorm:"not null;index" json:"adminUserId"`
	FileName    string                 `gorm:"type:varchar(255)" json:"fileName"`
	FileType    string                 `gorm:"type:varchar(20)" json:"fileType"` // csv, json
	Mode        string                 `gorm:"type:varchar(50)" json:"mode"`     // dry_run, create, update, upsert
	TotalRows   int                    `gorm:"default:0" json:"totalRows"`
	ValidRows   int                    `gorm:"default:0" json:"validRows"`
	Created     int                    `gorm:"default:0" json:"created"`
	Updated     int                    `gorm:"default:0" json:"updated"`
	Failed      int                    `gorm:"default:0" json:"failed"`
	Skipped     int                    `gorm:"default:0" json:"skipped"`
	Status      string                 `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, processing, completed, failed
	Errors      []map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"errors,omitempty"`
	Summary     map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"summary,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}
