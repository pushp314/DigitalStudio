package config

import (
	"log"
	"os"

	"github.com/pushp314/bizcode/go-server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	LoadConfig()
	dsn := AppConfig.DatabaseURL
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	// Always migrate critical marketplace tables to prevent 500 errors
	_ = DB.AutoMigrate(
		&models.User{},
		&models.RefreshToken{},
		&models.Product{},
		&models.Tag{},
		&models.ProductCategory{},
	)

	if os.Getenv("ENABLE_AUTOMIGRATE") == "true" {
		if AppConfig.AppEnv == "production" {
			log.Fatal("ENABLE_AUTOMIGRATE must remain disabled in production")
		}

		err = DB.AutoMigrate(
			&models.User{},
			&models.Tag{},
			&models.Product{},
			&models.ProductCategory{},
			&models.ServiceIntent{},
			&models.ExpertIntent{},
			&models.Order{},
			&models.OrderItem{},
			&models.SiteConfig{},
			&models.PremiumDoc{},
			&models.Review{},
			&models.License{},
			&models.Testimonial{},
			&models.Coupon{},
			&models.Showcase{},
			&models.HireDeveloperRequest{},
			&models.ExpertHelpRequest{},
			&models.ChatMessage{},
			&models.DocChatSession{},
			&models.AuditLog{},
			&models.GithubChangeRequest{},
			&models.EliteChatSession{},
			&models.EliteChatMessage{},
			&models.LicenseActivation{},
			&models.LicenseEvent{},
			&models.ProductLicensePolicy{},
			&models.Affiliate{},
			&models.AffiliateClick{},
			&models.AffiliateConversion{},
			&models.AffiliatePayoutRequest{},
			&models.CheckoutSession{},
			&models.CartRecoveryLog{},
			&models.ImportJob{},
			&models.RefreshToken{},
		)
		if err != nil {
			log.Fatal("Failed to auto-migrate database:", err)
		}
		log.Println("✅ AutoMigrate: Verified schema for all models (including ChatMessage)")
		log.Println("AutoMigrate enabled for this environment")
		return
	}

	log.Println("Skipping AutoMigrate. Apply versioned SQL migrations before starting the API.")
}
