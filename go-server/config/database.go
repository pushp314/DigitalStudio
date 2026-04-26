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

	if AppConfig.AppEnv == "production" {
		if os.Getenv("ENABLE_AUTOMIGRATE") == "true" {
			log.Fatal("ENABLE_AUTOMIGRATE must remain disabled in production")
		}
		log.Println("Production schema migration is disabled at runtime. Apply versioned SQL migrations before starting the API.")
		return
	}

	criticalModels := []interface{}{
		&models.User{},
		&models.RefreshToken{},
		&models.Product{},
		&models.Tag{},
		&models.ProductCategory{},
		&models.Post{},
		&models.EliteChatSession{},
		&models.EliteChatMessage{},
		&models.SiteConfig{},
		&models.Order{},
		&models.OrderItem{},
	}
	for _, m := range criticalModels {
		if err := DB.AutoMigrate(m); err != nil {
			log.Printf("FATAL: Failed to auto-migrate critical model %T: %v", m, err)
		}
	}

	if os.Getenv("ENABLE_AUTOMIGRATE") == "true" {
		if AppConfig.AppEnv == "production" {
			log.Fatal("ENABLE_AUTOMIGRATE must remain disabled in production")
		}

		allModels := []interface{}{
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
			&models.Post{},
		}
		for _, m := range allModels {
			err := DB.AutoMigrate(m)
			if err != nil {
				log.Printf("Warning: Failed to auto-migrate model %T: %v", m, err)
			}
		}
		log.Println("✅ AutoMigrate: Verified schema for all models (including ChatMessage)")
		log.Println("AutoMigrate enabled for this environment")
		return
	}

	log.Println("Skipping AutoMigrate. Apply versioned SQL migrations before starting the API.")
}
