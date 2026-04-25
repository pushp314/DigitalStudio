package services

import (
	"log/slog"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"gorm.io/gorm"
)

type AuditEvent struct {
	RequestID    string
	ActorUserID  *uint
	EventType    string
	ResourceType string
	ResourceID   *uint
	Severity     string
	Message      string
	Metadata     map[string]interface{}
}

func WriteAuditLog(db *gorm.DB, event AuditEvent) {
	if event.Severity == "" {
		event.Severity = "info"
	}

	slog.Default().Info("audit_event",
		slog.String("event_type", event.EventType),
		slog.String("resource_type", event.ResourceType),
		slog.Any("resource_id", event.ResourceID),
		slog.Any("actor_user_id", event.ActorUserID),
		slog.String("severity", event.Severity),
		slog.String("request_id", event.RequestID),
		slog.Any("metadata", event.Metadata),
	)

	targetDB := db
	if targetDB == nil {
		targetDB = config.DB
	}
	if targetDB == nil {
		return
	}

	entry := models.AuditLog{
		RequestID:    event.RequestID,
		ActorUserID:  event.ActorUserID,
		EventType:    event.EventType,
		ResourceType: event.ResourceType,
		ResourceID:   event.ResourceID,
		Severity:     event.Severity,
		Message:      event.Message,
		Metadata:     event.Metadata,
	}

	if err := targetDB.Create(&entry).Error; err != nil {
		slog.Default().Error("audit_log_persist_failed",
			slog.String("event_type", event.EventType),
			slog.String("resource_type", event.ResourceType),
			slog.String("request_id", event.RequestID),
			slog.String("error", err.Error()),
		)
	}
}
