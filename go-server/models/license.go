package models

import (
	"strings"
	"time"
)

type LicenseType string

const (
	LicensePersonal   LicenseType = "personal"
	LicenseCommercial LicenseType = "commercial"
)

type LicenseStatus string

const (
	LicenseStatusActive    LicenseStatus = "active"
	LicenseStatusExpired   LicenseStatus = "expired"
	LicenseStatusRevoked   LicenseStatus = "revoked"
	LicenseStatusSuspended LicenseStatus = "suspended"
)

type License struct {
	ID               uint          `gorm:"primaryKey" json:"id"`
	PublicID         string        `gorm:"uniqueIndex;type:varchar(64)" json:"publicId"`
	UserID           uint          `gorm:"not null;index" json:"userId"`
	User             User          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ProductID        uint          `gorm:"not null;index" json:"productId"`
	Product          Product       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"product,omitempty"`
	OrderID          uint          `gorm:"not null;index" json:"orderId"`
	Order            Order         `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"order,omitempty"`
	CustomerEmail    string        `gorm:"type:varchar(255)" json:"customerEmail"`
	Type             LicenseType   `gorm:"type:varchar(50);default:'personal'" json:"type"`
	Plan             string        `gorm:"type:varchar(50);default:'standard'" json:"plan"`
	LicenseKey       string        `gorm:"uniqueIndex;not null" json:"licenseKey"`
	SignedToken      string        `gorm:"type:text" json:"-"`
	IssuedTokenHash  string        `gorm:"type:varchar(128);index" json:"-"`
	Status           string        `gorm:"type:varchar(50);default:'active';index" json:"status"`
	MaxActivations   int           `gorm:"default:3" json:"maxActivations"`
	ActivationCount  int           `gorm:"default:0" json:"activationCount"`
	Metadata         map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"metadata,omitempty"`
	ExpiryDate       *time.Time    `json:"expiryDate,omitempty"`
	LastVerifiedAt   *time.Time    `json:"lastVerifiedAt,omitempty"`
	SuspendedAt      *time.Time    `json:"suspendedAt,omitempty"`
	RevokedAt        *time.Time    `json:"revokedAt,omitempty"`
	RevokeReason     string        `gorm:"type:text" json:"revokeReason,omitempty"`
	Activations      []LicenseActivation `gorm:"foreignKey:LicenseID" json:"activations,omitempty"`
	Events           []LicenseEvent      `gorm:"foreignKey:LicenseID" json:"events,omitempty"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
}

// IsActive checks if the license is currently usable.
func (l *License) IsActive() bool {
	if !strings.EqualFold(l.Status, string(LicenseStatusActive)) {
		return false
	}
	if l.ExpiryDate != nil && l.ExpiryDate.Before(time.Now()) {
		return false
	}
	return true
}

// CanActivate checks if a new activation is allowed.
func (l *License) CanActivate() bool {
	if !l.IsActive() {
		return false
	}
	if l.MaxActivations <= 0 {
		return true // unlimited
	}
	return l.ActivationCount < l.MaxActivations
}

type LicenseActivation struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	LicenseID       uint       `gorm:"not null;index" json:"licenseId"`
	FingerprintType string     `gorm:"type:varchar(50);not null" json:"fingerprintType"` // domain, device, project
	FingerprintValue string    `gorm:"type:varchar(512);not null;index" json:"fingerprintValue"`
	Status          string     `gorm:"type:varchar(50);default:'active'" json:"status"` // active, deactivated
	ActivatedAt     time.Time  `json:"activatedAt"`
	LastSeenAt      *time.Time `json:"lastSeenAt,omitempty"`
	AppVersion      string     `gorm:"type:varchar(50)" json:"appVersion,omitempty"`
	IP              string     `gorm:"type:varchar(100)" json:"ip,omitempty"`
	UserAgent       string     `gorm:"type:varchar(512)" json:"userAgent,omitempty"`
	Notes           string     `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type LicenseEvent struct {
	ID           uint                   `gorm:"primaryKey" json:"id"`
	LicenseID    uint                   `gorm:"not null;index" json:"licenseId"`
	ActivationID *uint                  `gorm:"index" json:"activationId,omitempty"`
	EventType    string                 `gorm:"type:varchar(100);not null;index" json:"eventType"`
	ActorUserID  *uint                  `json:"actorUserId,omitempty"`
	IP           string                 `gorm:"type:varchar(100)" json:"ip,omitempty"`
	Payload      map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"payload,omitempty"`
	CreatedAt    time.Time              `json:"createdAt"`
}

type ProductLicensePolicy struct {
	ID                    uint   `gorm:"primaryKey" json:"id"`
	ProductID             uint   `gorm:"uniqueIndex;not null" json:"productId"`
	Product               Product `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"product,omitempty"`
	SigningMode           string `gorm:"type:varchar(50);default:'ed25519'" json:"signingMode"`
	AllowOffline          bool   `gorm:"default:true" json:"allowOffline"`
	GracePeriodDays       int    `gorm:"default:7" json:"gracePeriodDays"`
	MaxActivationsDefault int    `gorm:"default:3" json:"maxActivationsDefault"`
	RequireHeartbeat      bool   `gorm:"default:false" json:"requireHeartbeat"`
	HeartbeatHours        int    `gorm:"default:72" json:"heartbeatHours"`
	UpdateAccessRequires  bool   `gorm:"default:false" json:"updateAccessRequiresActiveLicense"`
	BindingMode           string `gorm:"type:varchar(50);default:'domain'" json:"bindingMode"` // domain, device, project, none
	AllowDeactivation     bool   `gorm:"default:true" json:"allowDeactivation"`
	AllowTransfer         bool   `gorm:"default:false" json:"allowTransfer"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// NormalizeFingerprint normalizes domain-type fingerprints to prevent duplicates
// e.g., www.example.com → example.com, trailing slashes removed.
func NormalizeFingerprint(fpType string, value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if strings.EqualFold(fpType, "domain") {
		value = strings.TrimPrefix(value, "https://")
		value = strings.TrimPrefix(value, "http://")
		value = strings.TrimPrefix(value, "www.")
		value = strings.TrimSuffix(value, "/")
	}
	return value
}
