package services

import (
	"errors"
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pushp314/bizcode/go-server/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrLicenseNotFound       = errors.New("license not found")
	ErrLicenseInactive       = errors.New("license is not active")
	ErrActivationLimitReached = errors.New("activation limit reached")
	ErrActivationNotFound    = errors.New("activation not found")
	ErrDeactivationDenied    = errors.New("deactivation not allowed by product policy")
	ErrFingerprintRequired   = errors.New("fingerprint value is required")
)

// GenerateLicenseKey creates a human-readable license key.
func GenerateLicenseKey(userID uint, orderID uint, productID uint) string {
	return fmt.Sprintf("DS-%d-%d-%d-%s", userID, orderID, productID, strings.ToUpper(uuid.New().String()[:8]))
}

// EnsureOrderLicenses issues signed licenses for all eligible order items.
func EnsureOrderLicenses(tx *gorm.DB, order *models.Order, requestID string) (int, error) {
	if tx == nil || order == nil {
		return 0, nil
	}

	if len(order.OrderItems) == 0 {
		if err := tx.Preload("OrderItems").First(order, order.ID).Error; err != nil {
			return 0, err
		}
	}

	// Fetch user email for license
	var user models.User
	if err := tx.Select("id", "email").First(&user, order.UserID).Error; err != nil {
		return 0, err
	}

	issuedCount := 0
	for _, item := range order.OrderItems {
		var product models.Product
		if err := tx.Select("id", "type", "slug").First(&product, item.ProductID).Error; err != nil {
			return issuedCount, err
		}
		if product.Type == models.ProductTypeSubscription {
			continue
		}

		// Check if license already exists for this user+product+order
		var existing int64
		tx.Model(&models.License{}).Where("user_id = ? AND product_id = ? AND order_id = ?",
			order.UserID, item.ProductID, order.ID).Count(&existing)
		if existing > 0 {
			continue
		}

		// Load product license policy for max activations
		maxAct := 3
		bindingMode := "domain"
		plan := "standard"
		licenseType := models.LicensePersonal

		// Check if user has an active Elite membership to upgrade license terms
		if strings.EqualFold(user.SubscriptionPlan, "elite") {
			plan = "elite"
			maxAct = 10 // Elite members get higher limits by default
			licenseType = models.LicenseCommercial
		}

		var policy models.ProductLicensePolicy
		if err := tx.Where("product_id = ?", item.ProductID).First(&policy).Error; err == nil {
			// Policy overrides elite defaults if explicitly set higher
			if policy.MaxActivationsDefault > maxAct {
				maxAct = policy.MaxActivationsDefault
			}
			bindingMode = policy.BindingMode
		}

		publicID := uuid.New().String()
		licenseKey := GenerateLicenseKey(order.UserID, order.ID, item.ProductID)

		// Generate signed token
		claims := LicenseTokenClaims{
			LicenseID:   publicID,
			ProductID:   item.ProductID,
			UserID:      order.UserID,
			Plan:        plan,
			MaxAct:      maxAct,
			BindingMode: bindingMode,
			IssuedAt:    time.Now().Unix(),
		}
		signedToken, err := SignLicenseToken(claims)
		if err != nil {
			return issuedCount, fmt.Errorf("failed to sign license: %w", err)
		}

		license := models.License{
			PublicID:        publicID,
			UserID:          order.UserID,
			ProductID:       item.ProductID,
			OrderID:         order.ID,
			CustomerEmail:   user.Email,
			Type:            licenseType,
			Plan:            plan,
			LicenseKey:      licenseKey,
			SignedToken:     signedToken,
			IssuedTokenHash: HashToken(signedToken),
			Status:          string(models.LicenseStatusActive),
			MaxActivations:  maxAct,
			ExpiryDate:      nil,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		if err := tx.Create(&license).Error; err != nil {
			return issuedCount, err
		}

		issuedCount++

		// Log license event
		WriteLicenseEvent(tx, license.ID, nil, "license.issued", nil, "", map[string]interface{}{
			"orderId":    order.ID,
			"productId":  item.ProductID,
			"userId":     order.UserID,
			"plan":       plan,
			"maxAct":     maxAct,
			"requestId":  requestID,
		})

		orderID := order.ID
		WriteAuditLog(tx, AuditEvent{
			RequestID:    requestID,
			ActorUserID:  &order.UserID,
			EventType:    "license.issued",
			ResourceType: "license",
			ResourceID:   &license.ID,
			Message:      "Signed license issued for settled order",
			Metadata: map[string]interface{}{
				"orderId":   orderID,
				"productId": item.ProductID,
				"userId":    order.UserID,
				"publicId":  publicID,
			},
		})
	}

	return issuedCount, nil
}

// ActivateLicense binds a license to a fingerprint (domain/device/project).
func ActivateLicense(tx *gorm.DB, licenseKey string, fpType string, fpValue string, ip string, userAgent string, appVersion string) (*models.LicenseActivation, error) {
	fpType = strings.TrimSpace(strings.ToLower(fpType))
	fpValue = models.NormalizeFingerprint(fpType, fpValue)

	if fpValue == "" {
		return nil, ErrFingerprintRequired
	}

	var license models.License
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("license_key = ?", strings.TrimSpace(licenseKey)).
		First(&license).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLicenseNotFound
		}
		return nil, err
	}

	if !license.IsActive() {
		return nil, ErrLicenseInactive
	}

	// Check if this exact fingerprint already exists and is active
	var existingActivation models.LicenseActivation
	if err := tx.Where("license_id = ? AND fingerprint_type = ? AND fingerprint_value = ? AND status = ?",
		license.ID, fpType, fpValue, "active").First(&existingActivation).Error; err == nil {
		// Already activated on this fingerprint — update last_seen
		now := time.Now()
		existingActivation.LastSeenAt = &now
		existingActivation.IP = sanitizeIP(ip)
		existingActivation.AppVersion = appVersion
		tx.Save(&existingActivation)
		return &existingActivation, nil
	}

	if !license.CanActivate() {
		return nil, ErrActivationLimitReached
	}

	activation := models.LicenseActivation{
		LicenseID:        license.ID,
		FingerprintType:  fpType,
		FingerprintValue: fpValue,
		Status:           "active",
		ActivatedAt:      time.Now(),
		AppVersion:       appVersion,
		IP:               sanitizeIP(ip),
		UserAgent:        truncate(userAgent, 512),
	}

	if err := tx.Create(&activation).Error; err != nil {
		return nil, err
	}

	// Increment activation count
	license.ActivationCount++
	now := time.Now()
	license.LastVerifiedAt = &now
	tx.Save(&license)

	WriteLicenseEvent(tx, license.ID, &activation.ID, "license.activated", nil, sanitizeIP(ip), map[string]interface{}{
		"fingerprintType":  fpType,
		"fingerprintValue": fpValue,
		"appVersion":       appVersion,
	})

	return &activation, nil
}

// VerifyLicense checks license status and optionally updates heartbeat.
func VerifyLicense(tx *gorm.DB, licenseKey string, fpType string, fpValue string, ip string) (*models.License, bool, error) {
	fpValue = models.NormalizeFingerprint(fpType, fpValue)

	var license models.License
	if err := tx.Preload("Activations", "status = ?", "active").
		Where("license_key = ?", strings.TrimSpace(licenseKey)).
		First(&license).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, ErrLicenseNotFound
		}
		return nil, false, err
	}

	valid := license.IsActive()

	// If fingerprint provided, check if it's activated
	fingerprintValid := true
	if fpValue != "" && fpType != "" {
		fingerprintValid = false
		for _, a := range license.Activations {
			if strings.EqualFold(a.FingerprintType, fpType) && a.FingerprintValue == fpValue {
				fingerprintValid = true
				break
			}
		}
	}

	// Update last verified
	now := time.Now()
	tx.Model(&license).Update("last_verified_at", now)

	WriteLicenseEvent(tx, license.ID, nil, "license.verified", nil, sanitizeIP(ip), map[string]interface{}{
		"valid":            valid && fingerprintValid,
		"fingerprintType":  fpType,
		"fingerprintValue": fpValue,
	})

	return &license, valid && fingerprintValid, nil
}

// HeartbeatLicense updates the last-seen time for a specific activation.
func HeartbeatLicense(tx *gorm.DB, licenseKey string, fpType string, fpValue string, ip string) error {
	fpValue = models.NormalizeFingerprint(fpType, fpValue)

	var license models.License
	if err := tx.Where("license_key = ?", strings.TrimSpace(licenseKey)).First(&license).Error; err != nil {
		return ErrLicenseNotFound
	}
	if !license.IsActive() {
		return ErrLicenseInactive
	}

	now := time.Now()
	tx.Model(&models.LicenseActivation{}).
		Where("license_id = ? AND fingerprint_type = ? AND fingerprint_value = ? AND status = ?",
			license.ID, fpType, fpValue, "active").
		Updates(map[string]interface{}{
			"last_seen_at": now,
			"ip":           sanitizeIP(ip),
		})

	tx.Model(&license).Update("last_verified_at", now)
	return nil
}

// DeactivateLicenseActivation removes a specific activation if policy allows.
func DeactivateLicenseActivation(tx *gorm.DB, licenseID uint, activationID uint, actorUserID *uint) error {
	var license models.License
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&license, licenseID).Error; err != nil {
		return ErrLicenseNotFound
	}

	// Check product policy
	var policy models.ProductLicensePolicy
	if err := tx.Where("product_id = ?", license.ProductID).First(&policy).Error; err == nil {
		if !policy.AllowDeactivation {
			return ErrDeactivationDenied
		}
	}

	var activation models.LicenseActivation
	if err := tx.Where("id = ? AND license_id = ? AND status = ?",
		activationID, licenseID, "active").First(&activation).Error; err != nil {
		return ErrActivationNotFound
	}

	activation.Status = "deactivated"
	tx.Save(&activation)

	if license.ActivationCount > 0 {
		license.ActivationCount--
	}
	tx.Save(&license)

	WriteLicenseEvent(tx, licenseID, &activationID, "activation.deactivated", actorUserID, "", map[string]interface{}{
		"fingerprintType":  activation.FingerprintType,
		"fingerprintValue": activation.FingerprintValue,
	})

	return nil
}

// RevokeLicense marks a license as revoked.
func RevokeLicense(tx *gorm.DB, licenseID uint, reason string, actorUserID *uint) error {
	var license models.License
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&license, licenseID).Error; err != nil {
		return ErrLicenseNotFound
	}
	now := time.Now()
	license.Status = string(models.LicenseStatusRevoked)
	license.RevokedAt = &now
	license.RevokeReason = reason
	tx.Save(&license)

	// Deactivate all activations
	tx.Model(&models.LicenseActivation{}).
		Where("license_id = ? AND status = ?", licenseID, "active").
		Update("status", "deactivated")

	WriteLicenseEvent(tx, licenseID, nil, "license.revoked", actorUserID, "", map[string]interface{}{
		"reason": reason,
	})
	return nil
}

// SuspendLicense marks a license as suspended (reversible).
func SuspendLicense(tx *gorm.DB, licenseID uint, reason string, actorUserID *uint) error {
	var license models.License
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&license, licenseID).Error; err != nil {
		return ErrLicenseNotFound
	}
	now := time.Now()
	license.Status = string(models.LicenseStatusSuspended)
	license.SuspendedAt = &now
	tx.Save(&license)

	WriteLicenseEvent(tx, licenseID, nil, "license.suspended", actorUserID, "", map[string]interface{}{
		"reason": reason,
	})
	return nil
}

// ReactivateLicense restores a suspended license.
func ReactivateLicense(tx *gorm.DB, licenseID uint, actorUserID *uint) error {
	var license models.License
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&license, licenseID).Error; err != nil {
		return ErrLicenseNotFound
	}
	if license.Status != string(models.LicenseStatusSuspended) {
		return errors.New("only suspended licenses can be reactivated")
	}
	license.Status = string(models.LicenseStatusActive)
	license.SuspendedAt = nil
	tx.Save(&license)

	WriteLicenseEvent(tx, licenseID, nil, "license.reactivated", actorUserID, "", nil)
	return nil
}

// SuspendLicensesByOrder suspends all licenses for a given order (e.g., on refund).
func SuspendLicensesByOrder(tx *gorm.DB, orderID uint, reason string, actorUserID *uint) error {
	var licenses []models.License
	tx.Where("order_id = ? AND status = ?", orderID, string(models.LicenseStatusActive)).Find(&licenses)
	for _, lic := range licenses {
		if err := SuspendLicense(tx, lic.ID, reason, actorUserID); err != nil {
			return err
		}
	}
	return nil
}

// WriteLicenseEvent records a license event.
func WriteLicenseEvent(tx *gorm.DB, licenseID uint, activationID *uint, eventType string, actorUserID *uint, ip string, payload map[string]interface{}) {
	event := models.LicenseEvent{
		LicenseID:    licenseID,
		ActivationID: activationID,
		EventType:    eventType,
		ActorUserID:  actorUserID,
		IP:           ip,
		Payload:      payload,
		CreatedAt:    time.Now(),
	}
	tx.Create(&event)
}

func sanitizeIP(ip string) string {
	ip = strings.TrimSpace(ip)
	parsed := net.ParseIP(ip)
	if parsed != nil {
		return parsed.String()
	}
	// Might be ip:port
	host, _, err := net.SplitHostPort(ip)
	if err == nil {
		return host
	}
	if len(ip) > 100 {
		return ip[:100]
	}
	return ip
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}

// BackfillLegacyLicenses upgrades existing licenses that lack PublicID, SignedToken, or other new fields.
// This runs once on startup and only updates licenses that need it.
func BackfillLegacyLicenses(db *gorm.DB) {
	var legacyLicenses []models.License
	db.Where("public_id IS NULL OR public_id = '' OR signed_token IS NULL OR signed_token = ''").
		Find(&legacyLicenses)

	if len(legacyLicenses) == 0 {
		return
	}

	log.Printf("License[Backfill]: Found %d legacy licenses to upgrade", len(legacyLicenses))

	for i := range legacyLicenses {
		lic := &legacyLicenses[i]
		needsUpdate := false

		if lic.PublicID == "" {
			lic.PublicID = uuid.New().String()
			needsUpdate = true
		}
		if lic.Plan == "" {
			lic.Plan = "standard"
			needsUpdate = true
		}
		if lic.MaxActivations == 0 {
			lic.MaxActivations = 3
			needsUpdate = true
		}
		if lic.SignedToken == "" {
			claims := LicenseTokenClaims{
				LicenseID:   lic.PublicID,
				ProductID:   lic.ProductID,
				UserID:      lic.UserID,
				Plan:        lic.Plan,
				MaxAct:      lic.MaxActivations,
				BindingMode: "domain",
				IssuedAt:    lic.CreatedAt.Unix(),
			}
			token, err := SignLicenseToken(claims)
			if err == nil {
				lic.SignedToken = token
				lic.IssuedTokenHash = HashToken(token)
				needsUpdate = true
			}
		}
		if lic.Status == "" {
			lic.Status = string(models.LicenseStatusActive)
			needsUpdate = true
		}

		if needsUpdate {
			db.Save(lic)
		}
	}

	log.Printf("License[Backfill]: Upgraded %d legacy licenses", len(legacyLicenses))
}
