package models

import "time"

type AuditLog struct {
	ID           uint                   `gorm:"primaryKey" json:"id"`
	RequestID    string                 `gorm:"type:varchar(128);index" json:"requestId"`
	ActorUserID  *uint                  `gorm:"index" json:"actorUserId,omitempty"`
	EventType    string                 `gorm:"type:varchar(120);not null;index" json:"eventType"`
	ResourceType string                 `gorm:"type:varchar(80);not null;index" json:"resourceType"`
	ResourceID   *uint                  `gorm:"index" json:"resourceId,omitempty"`
	Severity     string                 `gorm:"type:varchar(20);not null;default:'info'" json:"severity"`
	Message      string                 `gorm:"type:text" json:"message"`
	Metadata     map[string]interface{} `gorm:"serializer:json;type:jsonb" json:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"createdAt"`
}
