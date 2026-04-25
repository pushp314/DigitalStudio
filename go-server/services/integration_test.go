package services

import (
	"context"
	"encoding/hex"
	"testing"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
// ... lines 16-40 omitted for brevity in thought, but I'll provide full range ...
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}
	config.DB = db

	// Migrate schema
	err = db.AutoMigrate(
		&models.User{}, &models.Tag{}, &models.Product{}, &models.ProductCategory{},
		&models.Order{}, &models.OrderItem{}, &models.License{}, &models.LicenseActivation{},
		&models.LicenseEvent{}, &models.ProductLicensePolicy{}, &models.Affiliate{},
		&models.AffiliateClick{}, &models.AffiliateConversion{}, &models.AffiliatePayoutRequest{},
		&models.CheckoutSession{}, &models.CartRecoveryLog{}, &models.ImportJob{},
		&models.AuditLog{}, &models.SiteConfig{}, &models.EliteChatSession{},
		&models.EliteChatMessage{},
	)
	if err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	// Initialize dependencies
	config.AppConfig.AppEnv = "test"
	config.AppConfig.LicenseSigningKey, _ = hex.DecodeString("0000000000000000000000000000000000000000000000000000000000000000")
	InitLicenseKeys()
	InitMailer()

	return db
}

func TestOrderToLicenseFlow(t *testing.T) {
	db := setupTestDB(t)

	// 1. Create User
	user := models.User{Name: "Test User", Email: "test@example.com"}
	db.Create(&user)

	// 2. Create Product
	product := models.Product{Title: "Test App", Price: 100, Type: models.ProductTypeFullstack, Slug: "test-app"}
	db.Create(&product)

	// 3. Create Draft Order
	order, err := CreateDraftOrder(context.Background(), DraftOrderInput{
		UserID: user.ID,
		Items: []DraftOrderItemInput{
			{ProductID: product.ID, Quantity: 1},
		},
	})
	require.NoError(t, err)
	require.Equal(t, 100.0, order.TotalPrice)

	// 3b. Attach Razorpay Order ID (Simulating the handler's action)
	rzpOrderID := "rzp_test_123"
	err = AttachRazorpayOrderID(context.Background(), order.ID, rzpOrderID, "test-req")
	require.NoError(t, err)

	// 4. Settle Order
	res, err := FinalizePaidOrder(context.Background(), SettleOrderInput{
		RazorpayOrderID: rzpOrderID,
		RazorpayPaymentID: "pay_123",
		Source: "test",
	})
	require.NoError(t, err)
	require.NotNil(t, res)
	require.Equal(t, 1, res.LicensesIssued)

	// 5. Verify License Existence
	var license models.License
	err = db.Where("order_id = ?", order.ID).First(&license).Error
	require.NoError(t, err)
	assert.Equal(t, user.ID, license.UserID)
	assert.NotEmpty(t, license.LicenseKey)
	assert.NotEmpty(t, license.SignedToken)
}

func TestRefundSuspensionFlow(t *testing.T) {
	db := setupTestDB(t)

	// Setup settled order with license
	user := models.User{Name: "Buyer", Email: "buyer@example.com"}
	db.Create(&user)
	product := models.Product{Title: "Premium Script", Price: 50, Type: models.ProductTypeTemplate, Slug: "premium-script"}
	db.Create(&product)

	order := models.Order{
		UserID: user.ID, 
		TotalPrice: 50, 
		Status: "paid", 
		PaymentStatus: "paid", 
		RazorpayOrderID: "ord_refund_test",
		OrderItems: []models.OrderItem{
			{ProductID: product.ID, Quantity: 1, Price: 50},
		},
	}
	db.Create(&order)
	
	_, err := EnsureOrderLicenses(db, &order, "test-req")
	require.NoError(t, err)

	// Verify license is active
	var license models.License
	err = db.Where("order_id = ?", order.ID).First(&license).Error
	require.NoError(t, err)
	require.Equal(t, string(models.LicenseStatusActive), license.Status)

	// Trigger Refund Logic
	err = SuspendLicensesByOrder(db, order.ID, "Customer refund", nil)
	assert.NoError(t, err)

	// Verify license is suspended
	db.First(&license, license.ID)
	assert.Equal(t, string(models.LicenseStatusSuspended), license.Status)
}

func TestLicenseVerification(t *testing.T) {
	db := setupTestDB(t)

	// Create license
	lic := models.License{
		UserID: 1, ProductID: 1, LicenseKey: "KEY-123", 
		Status: string(models.LicenseStatusActive), 
		MaxActivations: 1, ActivationCount: 0,
	}
	db.Create(&lic)

	// 1. Activate
	act, err := ActivateLicense(db, "KEY-123", "domain", "example.com", "1.1.1.1", "agent", "1.0")
	assert.NoError(t, err)
	assert.NotNil(t, act)

	// 2. Verify Success
	foundLic, valid, err := VerifyLicense(db, "KEY-123", "domain", "example.com", "1.1.1.1")
	assert.NoError(t, err)
	assert.True(t, valid)
	assert.Equal(t, lic.ID, foundLic.ID)

	// 3. Verify Failure (Wrong domain)
	_, valid, _ = VerifyLicense(db, "KEY-123", "domain", "malicious.com", "1.1.1.1")
	assert.False(t, valid)

	// 4. Verify Failure (Suspended)
	lic.Status = string(models.LicenseStatusSuspended)
	db.Save(&lic)
	_, valid, _ = VerifyLicense(db, "KEY-123", "domain", "example.com", "1.1.1.1")
	assert.False(t, valid)
}
