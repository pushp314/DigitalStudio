package utils

import (
	"strings"
	"time"

	"github.com/pushp314/bizcode/go-server/models"
)

func EffectiveSubscription(user models.User) (bool, string) {
	now := time.Now()

	// 1. Admins are always Enterprise / High Priority
	if user.Role == models.RoleAdmin {
		return true, "enterprise"
	}

	// 2. Strict Date Check for Pro Entitlement
	if user.IsPro {
		if user.ProExpiresAt == nil || user.ProExpiresAt.After(now) {
			return true, "pro"
		}
		// If we reached here, IsPro is true but the date has passed.
		return false, "free"
	}

	// 3. Fallback for manually set plans (rarely used, but kept for non-expiring tiers)
	plan := strings.ToLower(strings.TrimSpace(user.SubscriptionPlan))
	if plan == "enterprise" {
		return true, "enterprise"
	}

	// 4. Everything else is Free
	return false, "free"
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
