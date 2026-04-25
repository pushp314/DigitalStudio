package services

import (
	"log"
	"time"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

// CheckoutSessionInput is the data received from frontend when checkout starts.
type CheckoutSessionInput struct {
	UserID             *uint
	Email              string
	CartItems          []map[string]interface{}
	CartTotal          float64
	WhiteGloveSelected bool
	DeploymentFee      float64
	CouponCode         string
}

// CreateOrUpdateCheckoutSession creates or updates a checkout session for recovery tracking.
func CreateOrUpdateCheckoutSession(input CheckoutSessionInput) (*models.CheckoutSession, error) {
	if input.UserID == nil && input.Email == "" {
		return nil, nil // Can't track anonymous with no email
	}

	// Look for existing active session for this user
	var existing models.CheckoutSession
	query := config.DB.Where("status = ?", string(models.CheckoutActive))
	if input.UserID != nil {
		query = query.Where("user_id = ?", *input.UserID)
	} else {
		query = query.Where("email = ?", input.Email)
	}

	if err := query.First(&existing).Error; err == nil {
		// Update existing session
		existing.CartItems = input.CartItems
		existing.CartTotal = input.CartTotal
		existing.WhiteGloveSelected = input.WhiteGloveSelected
		existing.DeploymentFee = input.DeploymentFee
		existing.CouponCode = input.CouponCode
		config.DB.Save(&existing)
		return &existing, nil
	}

	// Create new session
	session := models.CheckoutSession{
		UserID:             input.UserID,
		Email:              input.Email,
		CartItems:          input.CartItems,
		CartTotal:          input.CartTotal,
		WhiteGloveSelected: input.WhiteGloveSelected,
		DeploymentFee:      input.DeploymentFee,
		CouponCode:         input.CouponCode,
		Status:             string(models.CheckoutActive),
		StartedAt:          time.Now(),
	}

	if err := config.DB.Create(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

// MarkCheckoutConverted marks a session as converted when payment completes.
func MarkCheckoutConverted(userID uint, orderID uint) {
	now := time.Now()
	config.DB.Model(&models.CheckoutSession{}).
		Where("user_id = ? AND status = ?", userID, string(models.CheckoutActive)).
		Updates(map[string]interface{}{
			"status":       string(models.CheckoutConverted),
			"order_id":     orderID,
			"completed_at": now,
		})
}

// DetectAbandonedCarts marks sessions as abandoned if not completed after the configured interval.
func DetectAbandonedCarts(abandonAfterMinutes int) int {
	if abandonAfterMinutes <= 0 {
		abandonAfterMinutes = 60 // default 1 hour
	}

	cutoff := time.Now().Add(-time.Duration(abandonAfterMinutes) * time.Minute)

	result := config.DB.Model(&models.CheckoutSession{}).
		Where("status = ? AND started_at < ?", string(models.CheckoutActive), cutoff).
		Update("status", string(models.CheckoutAbandoned))

	return int(result.RowsAffected)
}

// GetRecoverableAbandonedCarts returns abandoned carts eligible for recovery emails.
func GetRecoverableAbandonedCarts(stage int) []models.CheckoutSession {
	var sessions []models.CheckoutSession

	query := config.DB.Where("status = ? AND recovery_stage < ?",
		string(models.CheckoutAbandoned), stage+1)

	// Must have an email
	query = query.Where("email != '' AND email IS NOT NULL")

	// Timing logic per stage
	now := time.Now()
	switch stage {
	case 1:
		// 1 hour after abandonment
		query = query.Where("updated_at < ?", now.Add(-1*time.Hour))
	case 2:
		// 24 hours after abandonment
		query = query.Where("updated_at < ?", now.Add(-24*time.Hour))
	case 3:
		// 72 hours after abandonment
		query = query.Where("updated_at < ?", now.Add(-72*time.Hour))
	}

	query = query.Where("recovery_stage = ?", stage-1)
	query.Limit(50).Find(&sessions)
	return sessions
}

// RecordRecoveryAttempt logs a recovery email dispatch.
func RecordRecoveryAttempt(sessionID uint, email string, stage int, status string) {
	logEntry := models.CartRecoveryLog{
		CheckoutSessionID: sessionID,
		Email:             email,
		RecoveryStage:     stage,
		SentAt:            time.Now(),
		Status:            status,
	}
	config.DB.Create(&logEntry)

	// Update session's recovery stage
	config.DB.Model(&models.CheckoutSession{}).Where("id = ?", sessionID).
		Update("recovery_stage", stage)
}

// RunCartRecoveryJob is the background job that detects abandoned carts and dispatches recovery emails.
func RunCartRecoveryJob() {
	log.Println("CartRecovery[Job]: Starting abandoned cart scan...")

	// Step 1: Detect newly abandoned carts
	detected := DetectAbandonedCarts(60)
	if detected > 0 {
		log.Printf("CartRecovery[Job]: Detected %d newly abandoned carts", detected)
	}

	// Step 2: Process recovery stages 1, 2, 3
	for stage := 1; stage <= 3; stage++ {
		sessions := GetRecoverableAbandonedCarts(stage)
		for _, session := range sessions {
			// Check if this session was already converted
			if session.CompletedAt != nil {
				continue
			}

			email := session.Email
			if email == "" && session.UserID != nil {
				var user models.User
				if config.DB.Select("email").First(&user, *session.UserID).Error == nil {
					email = user.Email
				}
			}
			if email == "" {
				continue
			}

			// Dispatch recovery email via the configured Mailer
			err := Mailer.SendCartRecovery(email, stage, session.CartTotal)
			if err != nil {
				log.Printf("CartRecovery[Error]: Failed to send stage %d email to %s: %v", stage, email, err)
				RecordRecoveryAttempt(session.ID, email, stage, "failed")
				continue
			}

			log.Printf("CartRecovery[Email]: Stage %d recovery email sent to %s (session: %d)",
				stage, email, session.ID)

			RecordRecoveryAttempt(session.ID, email, stage, "sent")
		}
	}
}

// GetAbandonedCartStats returns analytics for the admin dashboard.
func GetAbandonedCartStats() map[string]interface{} {
	var totalAbandoned, recovered, whiteGloveAbandoned int64
	var recoveredRevenue float64

	config.DB.Model(&models.CheckoutSession{}).
		Where("status = ?", string(models.CheckoutAbandoned)).Count(&totalAbandoned)
	config.DB.Model(&models.CheckoutSession{}).
		Where("status = ? AND recovered_at IS NOT NULL", string(models.CheckoutConverted)).Count(&recovered)
	config.DB.Model(&models.CheckoutSession{}).
		Where("status = ? AND white_glove_selected = ?", string(models.CheckoutAbandoned), true).Count(&whiteGloveAbandoned)
	config.DB.Model(&models.CheckoutSession{}).
		Where("status = ? AND recovered_at IS NOT NULL", string(models.CheckoutConverted)).
		Select("COALESCE(SUM(cart_total), 0)").Scan(&recoveredRevenue)

	return map[string]interface{}{
		"totalAbandoned":      totalAbandoned,
		"recovered":           recovered,
		"whiteGloveAbandoned": whiteGloveAbandoned,
		"recoveredRevenue":    recoveredRevenue,
	}
}
