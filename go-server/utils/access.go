package utils

import (
	"strings"
	"time"

	"github.com/pushp314/digitalstudio/go-server/models"
)

func EffectiveSubscription(user models.User) (bool, string) {
	now := time.Now()
	if user.IsPro {
		if user.ProExpiresAt == nil || user.ProExpiresAt.After(now) {
			return true, "pro"
		}
	}

	plan := strings.ToLower(strings.TrimSpace(user.SubscriptionPlan))
	if plan == "" {
		plan = "free"
	}
	if plan == "pro" {
		plan = "free"
	}
	return false, plan
}

func NormalizeUserAccess(user models.User) models.User {
	isPro, plan := EffectiveSubscription(user)
	user.IsPro = isPro
	user.SubscriptionPlan = plan
	if !isPro {
		user.ProExpiresAt = nil
	}
	return user
}
